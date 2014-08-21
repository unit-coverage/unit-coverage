var fs = require('fs');
var esprima = require('esprima');
var escodegen = require('escodegen');

var Source = require('./source');

var EnsureBlocks = require('./processors/ensure-blocks');
var LineCounters = require('./processors/line-counters');
var FunctionCounters = require('./processors/function-counters');
var BranchCounters = require('./processors/branch-counters');

var MochaTestDriver = require('./test-drivers/mocha-test-driver');

function Instrumenter(fileSet, sourcePath, options) {
    options = options || {};
    var varPostfix = options.varPostfix || '__';
    var varPrefix = options.varPrefix || '__';
    this._fileSet = fileSet;
    this._sourcePath = sourcePath || process.cwd();
    this._countFunctionNames = {
        line: varPrefix + 'sepCoverageLineCount' + varPostfix,
        function: varPrefix + 'sepCoverageFunctionCount' + varPostfix,
        branch: varPrefix + 'sepCoverageBranchCount' + varPostfix
    };
    this._initFunctionName = varPrefix + 'sepCoverageInit' + varPostfix;
    this._saveFunctionName = varPrefix + 'sepCoverageSave' + varPostfix;
    this._mapVarName = varPrefix + 'sepCoverageMap' + varPostfix;
    this._beginTestFunctionName = varPrefix + 'sepCoverageBeginTest' + varPostfix;
    this._endTestFunctionName = varPrefix + 'sepCoverageEndTest' + varPostfix;
    this._noTestPlaceholder = '___no-test-name___';
    this._apiObjectName = '';
    this._excludes = [];
    this._lastFunctionIndex = 0;
    this._globalsTemplate = fs.readFileSync(__dirname + '/../res/globals.js', 'utf8');
    this._reportOnFileSave = false;
    this._exportFilename = 'coverage.json';
    this._export = false;
    this._testDriver = options.testDriver || new MochaTestDriver();

    this._processors = [
        new EnsureBlocks(),
        new LineCounters(this._countFunctionNames.line),
        new FunctionCounters(this._countFunctionNames.function),
        new BranchCounters(this._countFunctionNames.branch)
    ];
}

/**
 * @param {Boolean} enable
 */
Instrumenter.prototype.enableExport = function (enable) {
    this._export = enable;
};

/**
 * @returns {Boolean}
 */
Instrumenter.prototype.isExportEnabled = function () {
    return this._export;
};

/**
 * @param {String} filename
 */
Instrumenter.prototype.setExportFilename = function (filename) {
    this._exportFilename = filename;
};

/**
 * @returns {String}
 */
Instrumenter.prototype.getExportFilename = function () {
    return this._exportFilename;
};

/**
 * @param {Boolean} report
 */
Instrumenter.prototype.enableReportOnFileSave = function (report) {
    this._reportOnFileSave = report;
};

/**
 * @returns {Boolean}
 */
Instrumenter.prototype.isReportOnFileSaveEnabled = function () {
    return this._reportOnFileSave;
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
 * @param {String} objectGlobalName
 */
Instrumenter.prototype.setApiObjectName = function (objectGlobalName) {
    this._apiObjectName = objectGlobalName;
};

/**
 * @returns {String}
 */
Instrumenter.prototype.getApiObjectName = function () {
    return this._apiObjectName;
};

/**
 * @param {String} content
 * @param {String} baseFilename
 * @returns {String}
 */
Instrumenter.prototype.instrument = function (content, baseFilename) {
    var source = new Source(
        this._sourcePath,
        baseFilename,
        content,
        this._excludes,
        this._fileSet
    );

    this._processors.forEach(function (processor) {
        processor.process(source);
    });

    source.getAst().body.unshift(this._createCoverageInit(source.getCoverageInfo().toJSON()));

    return escodegen.generate(source.getAst());
};

/**
 * @param {String} content
 * @param {String} baseFilename
 * @returns {String}
 */
Instrumenter.prototype.placeMochaActivators = function (content, baseFilename) {
    return this._instrumentTestsWith(new MochaTestDriver(), content, baseFilename);
};

/**
 * @param {String} content
 * @param {String} baseFilename
 * @returns {String}
 */
Instrumenter.prototype.instrumentTests = function (content, baseFilename) {
    return this._instrumentTestsWith(this._testDriver, content, baseFilename);
};

/**
 * @param {TestDriver} driver
 * @param {String} content
 * @param {String} baseFilename
 * @returns {String}
 * @private
 */
Instrumenter.prototype._instrumentTestsWith = function (driver, content, baseFilename) {
    var source = new Source(
        this._sourcePath,
        baseFilename,
        content,
        this._excludes,
        this._fileSet
    );

    driver.configure({
        fileSet: this._fileSet,
        initFunctionName: this._initFunctionName,
        saveFunctionName: this._saveFunctionName,
        beginTestFunctionName: this._beginTestFunctionName,
        endTestFunctionName: this._endTestFunctionName
    });

    driver.process(source);

    return escodegen.generate(source.getAst());
};

Instrumenter.prototype._createCoverageInit = function (map) {
    var _this = this;
    var replacements = {
        __MAP__: JSON.stringify(map),
        __MAP_VAR_NAME__: this._mapVarName,
        __BEGIN_TEST_FUNCTION_NAME__: this._beginTestFunctionName,
        __END_TEST_FUNCTION_NAME__: this._endTestFunctionName,
        __INIT_FUNCTION_NAME__: this._initFunctionName,
        __SAVE_FUNCTION_NAME: this._saveFunctionName,
        __EXPORT_API_OBJECT__: this._apiObjectName,
        __NO_TEST_PLACEHOLDER__: this._noTestPlaceholder,
        __REPORT_ON_FILE_SAVE__: String(this._reportOnFileSave),
        __EXPORT_FILENAME__: JSON.stringify(this._exportFilename),
        __EXPORT__: this._export
    };
    Object.keys(this._countFunctionNames).forEach(function (key) {
        replacements['__' + key.toUpperCase() + '_COUNT_FUNCTION_NAME__'] = _this._countFunctionNames[key];
    });
    var js = this._globalsTemplate;
    Object.keys(replacements).forEach(function (subst) {
        js = js.replace(new RegExp(subst, 'g'), replacements[subst]);
    });
    return esprima.parse(js).body[0];
};

module.exports = Instrumenter;
