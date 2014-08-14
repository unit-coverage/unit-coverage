var path = require('path');
var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');
var SourceLocator = require('enb-source-map/lib/source-locator');
var minimatch = require('minimatch');

function Instrumenter(fileSet, sourcePath) {
    this._fileSet = fileSet;
    this._sourcePath = sourcePath || process.cwd();
    this._countFunctionName = '__sepCoverageCount__';
    this._initFunctionName = '__sepCoverageInit__';
    this._saveFunctionName = '__sepCoverageSave__';
    this._mapVarName = '__sepCoverageMap__';
    this._switchSetFunctionName = '__sepCoverageSwitchSet__';
    this._noSetPlaceholder = '___no-set-name___';
    this._excludes = [];
}

Instrumenter.prototype.addExclude = function (exclude) {
    this._excludes.push(exclude);
};

Instrumenter.prototype.instrument = function (content, baseFilename) {
    var ast = esprima.parse(content, {loc: true});
    var _this = this;
    var map = {};
    var sourceLocator = new SourceLocator(baseFilename, content);
    this.ensureBlocks(ast);
    estraverse.traverse(ast, {
        leave: function (node) {
            switch (node.type) {
                case 'Program':
                case 'BlockStatement':
                case 'SwitchCase':
                    var bodyParam = node.type === 'SwitchCase' ? 'consequent' : 'body';
                    var newBody = [];
                    node[bodyParam].forEach(function (statement) {
                        var loc = sourceLocator.locate(statement.loc.start.line, statement.loc.start.column);
                        var fileName = loc.source;
                        var lineNum = loc.line;
                        var relFilename = _this.getRelativeFilename(fileName);

                        if (!_this._excludes.some(function (exclude) {
                            return minimatch(relFilename, exclude);
                        })) {
                            map[relFilename] = map[relFilename] ||
                                {setName: _this._fileSet.getSetName(fileName), lines:{}};
                            map[relFilename].lines[lineNum] = 0;
                            newBody.push(_this.createCoverageCounter(relFilename, lineNum));
                        }

                        newBody.push(statement);
                    });
                    if (node.type === 'Program') {
                        newBody.unshift(_this.createCoverageInit(map));
                    }
                    node[bodyParam] = newBody;
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
    var sets = {};
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
                    var setName = _this._fileSet.getSetName(fileName);
                    if (sets[setName]) {
                        return;
                    }
                    sets[setName] = true;
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
                                    body: [_this.createSetSwitcher(_this._noSetPlaceholder)]
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
                                    body: [_this.createSetSwitcher(setName)]
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

Instrumenter.prototype.createCoverageInit = function (map) {
    return esprima.parse(
        '(function(){' +
            'if (this.' + this._mapVarName + ') {' +
                'for (var i in map) {' +
                    'if (map.hasOwnProperty(i)) this.' + this._mapVarName + '[i] = map[i];' +
                '}' +
            '} else {' +
                'var currentSetName;' +
                'var countFunc = function(filename, linenum) {' +
                    'if (!currentSetName || map[filename].setName === currentSetName)' +
                    'map[filename].lines[linenum] = (map[filename].lines[linenum] || 0) + 1;' +
                '};' +
                'var switchSetFunc = function(newSetName) {' +
                    'currentSetName = newSetName;' +
                '};' +
                'var initialized = false;' +
                'var initFunc = function() {' +
                    'if (initialized) return;' +
                    'initialized = true;' +
                    'Object.keys(map).forEach(function (filename) {' +
                        'var lines = map[filename].lines;' +
                        'Object.keys(lines).forEach(function (linenum) {' +
                            'if (lines[linenum] > 0) delete lines[linenum];' +
                        '});' +
                    '});' +
                '};' +
                'var saved = false;' +
                'var saveFunc = function () {' +
                    'if (saved) return;' +
                    'saved = true;' +
                    'if (typeof process !== "undefined" && process && process.env && process.env.sources) {' +
                        'require("fs").writeFileSync("coverage.json", JSON.stringify(' + this._mapVarName + '));' +
                    '}' +
                '};' +
                'var map = ' + JSON.stringify(map) + ';' +
                'this.' + this._countFunctionName + ' = countFunc;' +
                'this.' + this._switchSetFunctionName + ' = switchSetFunc;' +
                'this.' + this._initFunctionName + ' = initFunc;' +
                'this.' + this._saveFunctionName + ' = saveFunc;' +
                'this.' + this._mapVarName + ' = map;' +
            '}' +
        '})();'
    ).body[0];
};

Instrumenter.prototype.createCoverageCounter = function (filename, lineNum) {
    return {
        type: 'ExpressionStatement',
        expression: {
            type: 'CallExpression',
            callee: {name: this._countFunctionName, type: 'Identifier'},
            arguments: [
                {type: 'Literal', value: filename},
                {type: 'Literal', value: lineNum}
            ]
        }
    };
};

Instrumenter.prototype.createSetSwitcher = function (setName) {
    return {
        type: 'ExpressionStatement',
        expression: {
            type: 'CallExpression',
            callee: {name: this._switchSetFunctionName, type: 'Identifier'},
            arguments: [
                {type: 'Literal', value: setName}
            ]
        }
    };
};

Instrumenter.prototype.ensureBlocks = function (ast) {
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
    if (!node) {
        return node;
    }
    if (node.type !== 'BlockStatement') {
        return {
            type: 'BlockStatement',
            body: [node]
        };
    } else {
        return node;
    }
}

module.exports = Instrumenter;
