var fs = require('fs');
var path = require('path');
var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');
var minimatch = require('minimatch');

var SourceLocator = require('enb-source-map/lib/source-locator');

var CoverageInfo = require('./obj/coverage-info');
var FileInfo = require('./obj/file-info');
var StatInfo = require('./obj/stat-info');
var FunctionInfo = require('./obj/function-info');

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
    var ast = esprima.parse(content, {loc: true});
    var _this = this;
    var coverageInfo = new CoverageInfo();
    function ensureFileInfo(fileName) {
        var relFilename = _this.getRelativeFilename(fileName);
        var fileInfo = coverageInfo.getFileInfo(relFilename);
        if (!fileInfo) {
            fileInfo = new FileInfo(relFilename, _this._fileSet.getTestName(fileName));
            fileInfo.setStatInfo(new StatInfo());
            coverageInfo.addFileInfo(fileInfo);
        }
        return fileInfo;
    }
    var sourceLocator = new SourceLocator(baseFilename, content);
    this._ensureBlocks(ast);
    estraverse.traverse(ast, {
        enter: function (node) {
            switch (node.type) {
                case 'FunctionDeclaration':
                case 'FunctionExpression':
                    _this._lastFunctionIndex++;
                    node._functionId = _this._lastFunctionIndex;
                    break;
            }
        },
        leave: function (node) {
            switch (node.type) {
                case 'Program':
                case 'BlockStatement':
                case 'SwitchCase':
                    var bodyParam = node.type === 'SwitchCase' ? 'consequent' : 'body';
                    var newBody = [];
                    node[bodyParam].forEach(function (statement) {
                        var loc = sourceLocator.locate(statement.loc.start.line, statement.loc.start.column);
                        var relFilename = _this.getRelativeFilename(loc.source);

                        if (!filenameMatchesSomeOf(relFilename, _this._excludes)) {
                            var fileInfo = ensureFileInfo(loc.source);
                            fileInfo.getStatInfo().registerLine(loc.line);
                            newBody.push(_this._createCoverageCounter('line', [relFilename, loc.line]));
                        }

                        newBody.push(statement);
                    });
                    if (node.type === 'Program') {
                        newBody.unshift(_this._createCoverageInit(coverageInfo.toJSON()));
                    }
                    node[bodyParam] = newBody;
                    break;
                case 'FunctionDeclaration':
                case 'FunctionExpression':
                    var functionId = node._functionId;

                    var loc = sourceLocator.locate(node.loc.start.line, node.loc.start.column);
                    var relFilename = _this.getRelativeFilename(loc.source);

                    if (!filenameMatchesSomeOf(relFilename, _this._excludes)) {
                        var fileInfo = ensureFileInfo(loc.source);
                        var functionInfo = new FunctionInfo(
                            functionId,
                            node.id ? node.id.name : '(anonymous_' + functionId + ')',
                            node.loc
                        );
                        fileInfo.addFunctionInfo(functionInfo);
                        fileInfo.getStatInfo().registerFunction(functionInfo.getId());
                        node.body.body.unshift(_this._createCoverageCounter('function', [relFilename, functionId]));
                    }
                    break;
            }
        }
    });
    return escodegen.generate(ast);
};

Instrumenter.prototype.getRelativeFilename = function (filename) {
    return path.relative(this._sourcePath, filename);
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

Instrumenter.prototype._createCoverageCounter = function (type, args) {
    return {
        type: 'ExpressionStatement',
        expression: {
            type: 'CallExpression',
            callee: {name: this._countFunctionNames[type], type: 'Identifier'},
            arguments: args.map(function (arg) {
                return {type: 'Literal', value: arg};
            })
        }
    };
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

Instrumenter.prototype._ensureBlocks = function (ast) {
    estraverse.traverse(ast, {
        enter: function (node) {
            switch (node.type) {
                case 'IfStatement':
                    node.consequent = ensureBlock(node.consequent);
                    node.alternate = ensureBlock(node.alternate);
                    break;
                case 'ForStatement':
                case 'ForInStatement':
                case 'WhileStatement':
                case 'DoWhileStatement':
                    node.body = ensureBlock(node.body);
                    break;
                case 'WithStatement':
                    node.body = ensureBlock(node.body);
                    break;
            }
        }
    });
};

function ensureBlock(node) {
    if (node && node.type === 'BlockStatement') {
        return node;
    } else {
        return {
            type: 'BlockStatement',
            body: node ? [node] : []
        };
    }
}

/**
 * @param {String} filename
 * @param {String|RegExp} pattern
 */
function filenameMatches(filename, pattern) {
    if (typeof pattern === 'string') {
        return minimatch(filename, exclude);
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

module.exports = Instrumenter;
