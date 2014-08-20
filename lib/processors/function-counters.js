var estraverse = require('estraverse');
var FunctionInfo = require('../obj/function-info');

/**
 * @name FunctionCounters
 * @param {String} countFunctionName
 * @constructor
 * @implements Processor
 */
function FunctionCounters(countFunctionName) {
    this._countFunctionName = countFunctionName;
    this._lastFunctionIndex = 0;
}

var FUNCTION_NODES = {
    FunctionDeclaration: true,
    FunctionExpression: true
};

FunctionCounters.prototype.process = function (source) {
    var _this = this;
    estraverse.traverse(source.getAst(), {
        enter: function (node) {
            if (FUNCTION_NODES[node.type]) {
                _this._lastFunctionIndex++;
                node._functionId = _this._lastFunctionIndex;
            }
        },
        leave: function (node) {
            if (FUNCTION_NODES[node.type]) {
                var functionId = node._functionId;

                var loc = source.locate(node.loc.start.line, node.loc.start.column);

                if (!loc.isExcluded) {
                    var fileInfo = source.ensureFileInfo(loc.filename);
                    var functionInfo = new FunctionInfo(
                        functionId,
                        node.id ? node.id.name : '(anonymous_' + functionId + ')',
                        node.loc
                    );
                    fileInfo.addFunctionInfo(functionInfo);
                    fileInfo.getStatInfo().registerFunctionId(functionInfo.getId());
                    node.body.body.unshift(_this._createCoverageCounter(loc.relativeFilename, functionId));
                }
            }
        }
    });
};

FunctionCounters.prototype._createCoverageCounter = function (filename, functionId) {
    return {
        type: 'ExpressionStatement',
        expression: {
            type: 'CallExpression',
            callee: {name: this._countFunctionName, type: 'Identifier'},
            arguments: [
                {type: 'Literal', value: filename},
                {type: 'Literal', value: functionId}
            ]
        }
    };
};

module.exports = FunctionCounters;
