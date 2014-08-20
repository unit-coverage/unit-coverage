var path = require('path');
var minimatch = require('minimatch');
var esprima = require('esprima');

var SourceLocator = require('enb-source-map/lib/source-locator');
var CoverageInfo = require('./obj/coverage-info');
var FileInfo = require('./obj/file-info');
var StatInfo = require('./obj/stat-info');

function Source(sourceRoot, filename, content, excludes, fileSet) {
    this._filename = filename;
    this._sourceRoot = sourceRoot;
    this._sourceLocator = new SourceLocator(filename, content);
    this._excludes = excludes;
    this._ast = esprima.parse(content, {loc: true});
    this._coverageInfo = new CoverageInfo();
    this._fileSet = fileSet;
}

/**
 * @typedef {Object} SourceLocation
 * @property {String} filename
 * @property {String} relativeFilename
 * @property {Boolean} isExcluded
 * @property {Number} line
 * @property {Number} column
 */

/**
 * @param {Number} line
 * @param {Number} column
 * @returns {SourceLocation}
 */
Source.prototype.locate = function (line, column) {
    var loc = this._sourceLocator.locate(line, column);
    var relativeFilename = path.relative(this._sourceRoot, loc.source);
    return {
        filename: loc.source,
        relativeFilename: relativeFilename,
        isExcluded: filenameMatchesSomeOf(relativeFilename, this._excludes),
        line: loc.line,
        column: loc.column
    };
};

/**
 * @returns {String}
 */
Source.prototype.getFilename = function () {
    return this._filename;
};

/**
 * @returns {Object}
 */
Source.prototype.getAst = function () {
    return this._ast;
};

/**
 * @returns {CoverageInfo}
 */
Source.prototype.getCoverageInfo = function () {
    return this._coverageInfo;
};

/**
 * @param {String} filename
 * @returns {FileInfo}
 */
Source.prototype.ensureFileInfo = function (filename) {
    var relativeFilename = path.relative(this._sourceRoot, filename);
    var fileInfo = this._coverageInfo.getFileInfo(relativeFilename);
    if (!fileInfo) {
        fileInfo = new FileInfo({
            filename: relativeFilename,
            testName: this._fileSet.getTestName(filename)
        });
        this._coverageInfo.addFileInfo(fileInfo);
    }
    return fileInfo;
};

module.exports = Source;

/**
 * @param {String} filename
 * @param {String|RegExp} pattern
 */
function filenameMatches(filename, pattern) {
    if (typeof pattern === 'string') {
        return minimatch(filename, pattern);
    } else {
        return filename.match(pattern);
    }
}

/**
 * @param {String} filename
 * @param {(String|RegExp)[]} patterns
 */
function filenameMatchesSomeOf(filename, patterns) {
    return patterns.some(function (exclude) {
        return filenameMatches(filename, exclude);
    })
}
