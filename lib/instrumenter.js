var javascript = require('./javascript');

var Source = require('./source');

var EnsureBlocks = require('./processors/ensure-blocks');
var LineCounters = require('./processors/line-counters');
var FunctionCounters = require('./processors/function-counters');
var BranchCounters = require('./processors/branch-counters');

var MochaTestDriver = require('./test-drivers/mocha-test-driver');

/**
 *
 * @param {FileSet} fileSet
 * @param {String} sourceRoot
 * @param {Object} options
 * @param {Boolean} options.export
 * @param {String} options.exportFilename
 * @param {Boolean} options.reportOnFileSave
 * @param {TestDriver} options.testDriver
 * @param {String} options.apiObjectName
 * @param {Boolean} [options.excludeInitCoverage]
 * @constructor
 */
function Instrumenter(fileSet, sourceRoot, options) {
    options = options || {};
    this._fileSet = fileSet;
    this._sourceRoot = sourceRoot || process.cwd();
    this._noTestPlaceholder = '___no-test-name___';

    this._apiObjectName = options.apiObjectName || '__unitCoverage__';
    this._excludes = options.excludes || [];
    this._reportOnFileSave = Boolean(options.reportOnFileSave);
    this._exportFilename = options.exportFilename || 'coverage.json';
    this._export = options.export || false;
    this._testDriver = options.testDriver || new MochaTestDriver();
    this._excludeInitCoverage = options.hasOwnProperty('excludeInitCoverage') ? options.excludeInitCoverage : true;

    this._processors = [
        new EnsureBlocks(),
        new LineCounters(this._apiObjectName),
        new FunctionCounters(this._apiObjectName),
        new BranchCounters(this._apiObjectName)
    ];

    this._globalsTemplate = getGlobalsTemplate();
}

/**
 * @returns {String}
 */
Instrumenter.prototype.getSourceRoot = function () {
    return this._sourceRoot;
};

/**
 * @param {String|RegExp} exclude
 */
Instrumenter.prototype.addExclude = function (exclude) {
    this._excludes.push(exclude);
};

/**
 * @returns {(String|RegExp)[]}
 */
Instrumenter.prototype.getExcludes = function () {
    return this._excludes;
};

/**
 * @returns {String}
 */
Instrumenter.prototype.getApiObjectName = function () {
    return this._apiObjectName;
};

/**
 * @returns {TestDriver}
 */
Instrumenter.prototype.getTestDriver = function () {
    return this._testDriver;
};

/**
 * @returns {Boolean}
 */
Instrumenter.prototype.isInitCoverageExcluded = function () {
    return this._excludeInitCoverage;
};

/**
 * @param {String} content
 * @param {String} baseFilename
 * @returns {String}
 */
Instrumenter.prototype._instrument = function (content, baseFilename) {
    var source = new Source(
        this._sourceRoot,
        baseFilename,
        content,
        this._excludes,
        this._fileSet
    );

    this._processors.forEach(function (processor) {
        processor.process(source);
    });

    source.getAst().program.body.unshift(this._createCoverageInit(source.getCoverageInfo().toJSON()));

    return source;
};

/**
 * @param {String} content
 * @param {String} baseFilename
 * @returns {String}
 */
Instrumenter.prototype.instrument = function (content, baseFilename) {
    return javascript.generate(this._instrument(content, baseFilename).getAst());
};

/**
 * @param {String} content
 * @param {String} baseFilename
 * @returns {CoverageInfo}
 */
Instrumenter.prototype.generateCoverageInfo = function (content, baseFilename) {
    return this._instrument(content, baseFilename).getCoverageInfo();
};

/**
 * @param {String} content
 * @param {String} baseFilename
 * @returns {String}
 */
Instrumenter.prototype.instrumentTests = function (content, baseFilename) {
    return this._instrumentTestsUsing(this._testDriver, content, baseFilename);
};

/**
 * @param {TestDriver} driver
 * @param {String} content
 * @param {String} baseFilename
 * @returns {String}
 * @private
 */
Instrumenter.prototype._instrumentTestsUsing = function (driver, content, baseFilename) {
    var source = new Source(
        this._sourceRoot,
        baseFilename,
        content,
        this._excludes,
        this._fileSet
    );

    driver.configure({
        apiObjectName: this._apiObjectName
    });

    driver.process(source);

    return javascript.generate(source.getAst());
};

Instrumenter.prototype._createCoverageInit = function (map) {
    var replacements = {
        __MAP__: JSON.stringify(map),
        __EXPORT_API_OBJECT__: this._apiObjectName,
        __NO_TEST_PLACEHOLDER__: this._noTestPlaceholder,
        __REPORT_ON_FILE_SAVE__: String(this._reportOnFileSave),
        __EXPORT_FILENAME__: JSON.stringify(this._exportFilename),
        __EXPORT__: this._export,
        __EXCLUDE_INIT_COVERAGE__: String(this._excludeInitCoverage)
    };
    var js = this._globalsTemplate;
    Object.keys(replacements).forEach(function (subst) {
        js = js.replace(new RegExp(subst, 'g'), replacements[subst]);
    });
    return javascript.parse(js).program.body[0];
};

module.exports = Instrumenter;

var globalsTemplate;

function getGlobalsTemplate() {
    if (!globalsTemplate) {
        globalsTemplate = '(' + require('../res/globals').toString() + ')()';
    }
    return globalsTemplate;
}
