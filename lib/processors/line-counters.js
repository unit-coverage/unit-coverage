var javascript = require('../javascript');

/**
 * @name LineCounters
 * @param {String} apiObjectName
 * @constructor
 * @implements Processor
 */
function LineCounters(apiObjectName) {
    this._apiObjectName = apiObjectName;
}

var STATEMENT_CONTAINERS = {
    Program: true,
    BlockStatement: true,
    SwitchCase: true
};

LineCounters.prototype.process = function (source) {
    var _this = this;
    javascript.traverse(source.getAst(), {
        exit: function (context) {
            var node = context.node;
            if (STATEMENT_CONTAINERS[node.type]) {
                var bodyParam = node.type === 'SwitchCase' ? 'consequent' : 'body';
                var newBody = [];

                node[bodyParam].forEach(function (statement) {
                    var loc = source.locate(statement.loc.start.line, statement.loc.start.column);

                    if (!loc.isExcluded) {
                        var fileInfo = source.ensureFileInfo(loc.filename);
                        fileInfo.getStatInfo().registerLineNumber(loc.line);
                        newBody.push(_this._createCoverageCounter(loc.relativeFilename, loc.line));
                    }

                    newBody.push(statement);
                });

                node[bodyParam] = newBody;
            }
        }
    });
};

LineCounters.prototype._createCoverageCounter = function (filename, lineNumber) {
    return {
        type: 'ExpressionStatement',
        expression: {
            type: 'CallExpression',
            callee: {
                type: 'MemberExpression',
                computed: false,
                object: {name: this._apiObjectName, type: 'Identifier'},
                property: {name: 'countLine', type: 'Identifier'}
            },
            arguments: [
                {type: 'StringLiteral', value: filename},
                {type: 'NumericLiteral', value: lineNumber}
            ]
        }
    };
};

module.exports = LineCounters;
