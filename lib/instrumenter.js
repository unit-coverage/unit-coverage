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
    this._mapVarName = '__sepCoverageMap__';
    this._setVarName = '__sepCoverageSet__';
    this._ignoreInitCode = true;
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
                            map[relFilename] = map[relFilename] || {setName: _this._fileSet.getSetName(fileName), lines:{}};
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
                node.body.push({
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'MemberExpression',
                            object: {
                                type: 'MemberExpression',
                                object: {
                                    type: 'Identifier',
                                    name: 'mocha'
                                },
                                property: {
                                    type: 'Identifier',
                                    name: 'suite'
                                }
                            },
                            property: {
                                type: 'Identifier',
                                name: 'beforeAll'
                            }
                        },
                        arguments: [
                            {type: 'Identifier', name: _this._initFunctionName}
                        ]
                    }
                });
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
                                    body: [{
                                        type: 'ExpressionStatement',
                                        expression: {
                                            type: 'AssignmentExpression',
                                            operator: '=',
                                            left: {
                                                type: 'Identifier',
                                                name: _this._setVarName
                                            },
                                            right: {
                                                type: 'Literal',
                                                value: '___no-set-name___'
                                            }
                                        }
                                    }]
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
                                    body: [{
                                        type: 'ExpressionStatement',
                                        expression: {
                                            type: 'AssignmentExpression',
                                            operator: '=',
                                            left: {
                                                type: 'Identifier',
                                                name: _this._setVarName
                                            },
                                            right: {
                                                type: 'Literal',
                                                value: setName
                                            }
                                        }
                                    }]
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
            'var countFunc = function(filename, linenum) {' +
                'if (!' + this._setVarName + ' || map[filename].setName === ' + this._setVarName + ')' +
                'map[filename].lines[linenum] = (map[filename].lines[linenum] || 0) + 1;' +
            '};' +
            'var initFunc = function() {' +
                'Object.keys(map).forEach(function (filename) {' +
                    'var lines = map[filename].lines;' +
                    'Object.keys(lines).forEach(function (linenum) {' +
                        'if (lines[linenum] > 0) delete lines[linenum];' +
                    '});' +
                '});' +
            '};' +
            'var map = ' + JSON.stringify(map) + ';' +
            'this.' + this._setVarName + ' = undefined;' +
            'this.' + this._countFunctionName + ' = countFunc;' +
            'this.' + this._initFunctionName + ' = initFunc;' +
            'this.' + this._mapVarName + ' = map;' +
        '})();'
    ).body[0];
};

Instrumenter.prototype.createCoverageCounter = function (filename, setName) {
    return {
        type: 'ExpressionStatement',
        expression: {
            type: 'CallExpression',
            callee: {name: this._countFunctionName, type: 'Identifier'},
            arguments: [
                {type: 'Literal', value: filename},
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
    if (!node) return node;
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
