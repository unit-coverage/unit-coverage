var fs = require('fs');
var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');

var SourceLocator = require('enb-source-map/lib/source-locator');

var Source = require('./source');

var EnsureBlocks = require('./processors/ensure-blocks');
var LineCounters = require('./processors/line-counters');
var FunctionCounters = require('./processors/function-counters');

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
    this._switchTestFunctionName = varPrefix + 'sepCoverageSwitchTest' + varPostfix;
    this._noTestPlaceholder = '___no-test-name___';
    this._apiObjectName = '';
    this._excludes = [];
    this._lastFunctionIndex = 0;
    this._globalsTemplate = fs.readFileSync(__dirname + '/../res/globals.js', 'utf8');
    this._reportOnFileSave = false;
    this._exportFilename = 'coverage.json';
    this._ignoreInitCode = true;
    this._export = false;

    this._processors = [
        new EnsureBlocks(),
        new LineCounters(this._countFunctionNames.line),
        new FunctionCounters(this._countFunctionNames.function)
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

Instrumenter.prototype.placeMochaActivators = function (content, baseFilename) {
    var ast = esprima.parse(content, {loc: true});
    var _this = this;
    var tests = {};
    var sourceLocator = new SourceLocator(baseFilename, content);

    estraverse.traverse(ast, {
        enter: function (node, parent) {
            if (node.type === 'Program' && _this._ignoreInitCode) {
                return node.body.push(
                    esprima.parse(
                        'if (typeof mocha !== "undefined") {' +
                            'mocha.suite.beforeAll(' + _this._initFunctionName + ');' +
                            'mocha.suite.afterAll(' + _this._saveFunctionName + ');' +
                        '} else {' +
                            'before(' + _this._initFunctionName + ');' +
                            'after(' + _this._saveFunctionName + ');' +
                        '}'
                    ).body[0]
                );
            }
            if (node.type === 'FunctionExpression' && parent.type === 'CallExpression') {
                if (parent.callee.type === 'Identifier' && parent.callee.name === 'describe') {
                    var loc = sourceLocator.locate(node.loc.start.line, node.loc.start.column);
                    var fileName = loc.source;
                    var testName = _this._fileSet.getTestName(fileName);
                    if (tests[testName]) {
                        return;
                    }
                    tests[testName] = true;
                    node.body.body.unshift({
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'CallExpression',
                            callee: {name: 'after', type: 'Identifier'},
                            arguments: [{
                                type: 'FunctionExpression',
                                params: [],
                                body: {
                                    type: 'BlockStatement',
                                    body: [_this._createTestSwitcher(_this._noTestPlaceholder)]
                                }
                            }]
                        }
                    });
                    node.body.body.unshift({
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'CallExpression',
                            callee: {name: 'before', type: 'Identifier'},
                            arguments: [{
                                type: 'FunctionExpression',
                                params: [],
                                body: {
                                    type: 'BlockStatement',
                                    body: [_this._createTestSwitcher(testName)]
                                }
                            }]
                        }
                    });
                    return estraverse.VisitorOption.Skip;
                }
            }
        }
    });
    return escodegen.generate(ast);
};

Instrumenter.prototype._createCoverageInit = function (map) {
    var _this = this;
    var replacements = {
        __MAP__: JSON.stringify(map),
        __MAP_VAR_NAME__: this._mapVarName,
        __SWITCH_TEST_FUNCTION_NAME__: this._switchTestFunctionName,
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

Instrumenter.prototype._createTestSwitcher = function (setName) {
    return {
        type: 'ExpressionStatement',
        expression: {
            type: 'CallExpression',
            callee: {name: this._switchTestFunctionName, type: 'Identifier'},
            arguments: [
                {type: 'Literal', value: setName}
            ]
        }
    };
};

module.exports = Instrumenter;
