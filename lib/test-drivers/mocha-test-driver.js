var path = require('path');
var javascript = require('../javascript');
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
    javascript.traverse(source.getAst(), {
        enter: function (context) {
            var parent = context.parent;
            var node = context.node;
            if ((node.type === 'FunctionExpression' ||
                node.type === 'ArrowFunctionExpression') &&
                node.body.type === 'BlockStatement' &&
                parent.type === 'CallExpression'
            ) {
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
                    context.skip();
                }
            }
        }
    });
    source.getAst().program.body.push(
        javascript.parse(
            'if (typeof ' + this._apiObjectName + ' !== "undefined") {' +
                'if (typeof mocha !== "undefined") {' +
                    'mocha.suite.beforeAll(' + this._apiObjectName + '.initialize);' +
                    'mocha.suite.afterAll(' + this._apiObjectName + '.save);' +
                '} else {' +
                    'before(' + this._apiObjectName + '.initialize);' +
                    'after(' + this._apiObjectName + '.save);' +
                '}' +
            '}'
        ).program.body[0]
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
                {type: 'StringLiteral', value: setName}
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
    var args = [].concat(options.runnerArgs, ['--require', path.resolve(__dirname, '../require-replacement.js')]);
    return subprocess.run(options.bin, args, options, options.quiet);
};

module.exports = MochaTestDriver;
