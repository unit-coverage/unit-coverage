var estraverse = require('estraverse');

/**
 * @name LineCounters
 * @param {String} countFunctionName
 * @constructor
 * @implements Processor
 */
function LineCounters(countFunctionName) {
    this._countFunctionName = countFunctionName;
}

var STATEMENT_CONTAINERS = {
    Program: true,
    BlockStatement: true,
    SwitchCase: true
};

LineCounters.prototype.process = function (source) {
    var _this = this;
    estraverse.traverse(source.getAst(), {
        leave: function (node) {
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
            callee: {name: this._countFunctionName, type: 'Identifier'},
            arguments: [
                {type: 'Literal', value: filename},
                {type: 'Literal', value: lineNumber}
            ]
        }
    };
};

module.exports = LineCounters;
