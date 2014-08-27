var path = require('path');

/**
 * @name RelativeFileSet
 * @implements FileSet
 * @constructor
 */
function RelativeFileSet() {
    this._sources = '';
    this._tests = '';
    this._suffix = '.';
}

/**
 * @param {Object} options
 * @param {String} [options.suffix]
 * @param {String} [options.tests]
 * @param {String} [options.sources]
 */
RelativeFileSet.prototype.configure = function (options) {
    if (options.hasOwnProperty('suffix')) {
        this._suffix = options.suffix;
    }
    if (options.hasOwnProperty('tests')) {
        this._tests = options.tests;
    }
    if (options.hasOwnProperty('sources')) {
        this._sources = options.sources;
    }
};

/**
 * @param {String} filename
 * @param {String} sourceRoot
 * @returns {String}
 */
RelativeFileSet.prototype.getTestName = function (filename, sourceRoot) {
    var sourcesDir = path.join(sourceRoot, this._sources);
    var testsDir = path.join(sourceRoot, this._tests);
    var testName;
    if (this._tests && filename.indexOf(testsDir) !== -1) {
        testName = path.relative(testsDir, filename);
    } else if (this._sources && filename.indexOf(sourcesDir) !== -1) {
        testName = path.relative(sourcesDir, filename);
    } else {
        testName = path.relative(sourceRoot, filename);
    }
    if (this._suffix) {
        var testNameBits = testName.split(path.sep);
        var basename = testNameBits.pop();
        basename = basename.split(this._suffix).shift();
        testNameBits.push(basename);
        return testNameBits.join(path.sep);
    } else {
        return testName;
    }
};

module.exports = RelativeFileSet;
