var babylon = require('babylon');
var generate = require('babel-generator').default;
var babelTraverse = require('babel-traverse').default;

module.exports = {
    parse: function (sourceCode) {
        return babylon.parse(
            sourceCode,
            {
                sourceType: 'module',
                strictMode: false,
                comment: true,
                ecmaVersion: Infinity,
                allowHashBang: true,
                plugins: [
                    'jsx',
                    'flow',
                    'asyncFunctions',
                    'classConstructorCall',
                    'doExpressions',
                    'trailingFunctionCommas',
                    'objectRestSpread',
                    'decorators',
                    'classProperties',
                    'exportExtensions',
                    'exponentiationOperator',
                    'asyncGenerators'
                ]
            }
        );
    },

    generate: function (ast) {
        return generate(ast, {}, '    ').code;
    },

    traverse: function (ast, opts) {
        return babelTraverse(ast, opts);
    }
};
