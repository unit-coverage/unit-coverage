var path = require('path');
var esprima = require('esprima');
var estraverse = require('estraverse');
var subprocess = require('../utils/subprocess');

/**
 * @name MochaTestDriver
 * @implements TestDriver
 * @constructor
 */
function MochaTestDriver() {
    this._apiObjectName = null;
}

MochaTestDriver.prototype.configure = function (options) {
    this._apiObjectName = options.apiObjectName;
};

/**
 * @param {Source} source
 */
MochaTestDriver.prototype.process = function (source) {
    var _this = this;
    var tests = {};
    estraverse.traverse(source.getAst(), {
        enter: function (node, parent) {
            if (node.type === 'FunctionExpression' && parent.type === 'CallExpression') {
                if (parent.callee.type === 'Identifier' && parent.callee.name === 'describe') {
                    var loc = source.locate(node.loc.start.line, node.loc.start.column);
                    if (tests[loc.testName]) {
                        return;
                    }
                    tests[loc.testName] = true;
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
                                    body: [_this._createTestSwitcher('endTest')]
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
                                    body: [_this._createTestSwitcher('beginTest', loc.testName)]
                                }
                            }]
                        }
                    });
                    return estraverse.VisitorOption.Skip;
                }
            }
        }
    });
    source.getAst().body.push(
        esprima.parse(
            'if (typeof mocha !== "undefined") {' +
                'mocha.suite.beforeAll(' + this._apiObjectName + '.initialize);' +
                'mocha.suite.afterAll(' + this._apiObjectName + '.save);' +
            '} else {' +
                'before(' + this._apiObjectName + '.initialize);' +
                'after(' + this._apiObjectName + '.save);' +
            '}'
        ).body[0]
    );
};

MochaTestDriver.prototype._createTestSwitcher = function (functionName, setName) {
    return {
        type: 'ExpressionStatement',
        expression: {
            type: 'CallExpression',
            callee: {
                type: 'MemberExpression',
                computed: false,
                object: {name: this._apiObjectName, type: 'Identifier'},
                property: {name: functionName, type: 'Identifier'}
            },
            arguments: setName ? [
                {type: 'Literal', value: setName}
            ] : []
        }
    };
};

/**
 * @param {TestDriverOptions} options
 */
MochaTestDriver.prototype.run = function (options) {
    if (!options.bin) {
        options.bin = 'node_modules/.bin/mocha';
    }
    options.testDriver = 'mocha';
    var args = ['--compilers', 'js:' + path.resolve(__dirname, '../require-replacement.js')].concat(options.runnerArgs);
    return subprocess.run(options.bin, args, options, options.quiet);
};

module.exports = MochaTestDriver;
