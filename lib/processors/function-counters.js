var javascript = require('../javascript');
var FunctionInfo = require('../obj/function-info');

/**
 * @name FunctionCounters
 * @param {String} apiObjectName
 * @constructor
 * @implements Processor
 */
function FunctionCounters(apiObjectName) {
    this._apiObjectName = apiObjectName;
    this._lastFunctionIndex = 0;
    this._lastClassIndex = 0;
}

var FUNCTION_NODES = {
    FunctionDeclaration: true,
    FunctionExpression: true,
    ArrowFunctionExpression: true,
    ClassMethod: true
};

FunctionCounters.prototype.process = function (source) {
    var _this = this;
    javascript.traverse(source.getAst(), {
        enter: function (context) {
            var node = context.node;
            if (FUNCTION_NODES[node.type]) {
                _this._lastFunctionIndex++;
                node._functionId = _this._lastFunctionIndex;
            }
            if (node.type === 'ClassExpression' || node.type === 'ClassDeclaration') {
                if (node.id) {
                    node._className = node.id.name;
                } else {
                    _this._lastClassIndex++;
                    node._className = '(anonymous_class_' + _this._lastClassIndex + ')';
                }
            }
        },
        exit: function (context) {
            var node = context.node;

            if (FUNCTION_NODES[node.type]) {
                var functionId = node._functionId;

                var loc = source.locate(node.loc.start.line, node.loc.start.column);
                var locStart = locatePart(node.loc.start);
                var locEnd = locatePart(node.loc.end);

                if (!loc.isExcluded) {
                    var fileInfo = source.ensureFileInfo(loc.filename);
                    var functionName = node.id && node.id.name;
                    if (node.type === 'ClassMethod') {
                        var classDeclaration = context.parentPath.parentPath.node;
                        functionName = classDeclaration._className + '::' + node.key.name;
                        if (node.kind === 'get') {
                            functionName += '(get)';
                        }
                        if (node.kind === 'set') {
                            functionName += '(set)';
                        }
                    }
                    functionName = functionName || '(anonymous_' + functionId + ')';
                    var functionInfo = new FunctionInfo(
                        functionId,
                        functionName,
                        {start: locStart, end: locEnd}
                    );
                    fileInfo.addFunctionInfo(functionInfo);
                    fileInfo.getStatInfo().registerFunctionId(functionInfo.getId());
                    node.body.body.unshift(_this._createCoverageCounter(loc.relativeFilename, functionId));
                }
            }
        }
    });

    function locatePart(loc) {
        var srcLoc = source.locate(loc.line, loc.column);
        return {line: srcLoc.line, column: srcLoc.column};
    }
};

FunctionCounters.prototype._createCoverageCounter = function (filename, functionId) {
    return {
        type: 'ExpressionStatement',
        expression: {
            type: 'CallExpression',
            callee: {
                type: 'MemberExpression',
                computed: false,
                object: {name: this._apiObjectName, type: 'Identifier'},
                property: {name: 'countFunction', type: 'Identifier'}
            },
            arguments: [
                {type: 'StringLiteral', value: filename},
                {type: 'NumericLiteral', value: functionId}
            ]
        }
    };
};

module.exports = FunctionCounters;
