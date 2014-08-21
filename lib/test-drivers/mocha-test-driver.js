var esprima = require('esprima');
var estraverse = require('estraverse');

function MochaTestDriver() {
    this._fileSet = null;
    this._initFunctionName = null;
    this._saveFunctionName = null;
    this._beginTestFunctionName = null;
    this._endTestFunctionName = null;
}

MochaTestDriver.prototype.configure = function (options) {
    this._fileSet = options.fileSet;
    this._initFunctionName = options.initFunctionName;
    this._saveFunctionName = options.saveFunctionName;
    this._beginTestFunctionName = options.beginTestFunctionName;
    this._endTestFunctionName = options.endTestFunctionName;
};

MochaTestDriver.prototype.process = function (source) {
    var _this = this;
    var tests = {};
    estraverse.traverse(source.getAst(), {
        enter: function (node, parent) {
            if (node.type === 'FunctionExpression' && parent.type === 'CallExpression') {
                if (parent.callee.type === 'Identifier' && parent.callee.name === 'describe') {
                    var loc = source.locate(node.loc.start.line, node.loc.start.column);
                    var testName = _this._fileSet.getTestName(loc.filename);
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
                                    body: [_this._createTestSwitcher(_this._endTestFunctionName)]
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
                                    body: [_this._createTestSwitcher(_this._beginTestFunctionName, testName)]
                                }
                            }]
                        }
                    });
                    return estraverse.VisitorOption.Skip;
                }
            }
        }
    });
    return source.getAst().body.push(
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
};



MochaTestDriver.prototype._createTestSwitcher = function (functionName, setName) {
    return {
        type: 'ExpressionStatement',
        expression: {
            type: 'CallExpression',
            callee: {name: functionName, type: 'Identifier'},
            arguments: setName ? [
                {type: 'Literal', value: setName}
            ] : []
        }
    };
};

module.exports = MochaTestDriver;
