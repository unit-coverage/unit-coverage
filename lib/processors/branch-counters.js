var estraverse = require('estraverse');
var BranchInfo = require('../obj/branch-info');

/**
 * @name BranchCounters
 * @param {String} apiObjectName
 * @constructor
 * @implements Processor
 */
function BranchCounters(apiObjectName) {
    this._apiIObjectName = apiObjectName;
    this._lastBranchIndex = 0;
}

var BRANCH_NODES = {
    LogicalExpression: true,
    ConditionalExpression: true,
    IfStatement: true,
    SwitchStatement: true
};

BranchCounters.prototype.process = function (source) {
    var _this = this;
    estraverse.traverse(source.getAst(), {
        enter: function (node) {
            if (BRANCH_NODES[node.type]) {
                _this._lastBranchIndex++;
                node._branchId = _this._lastBranchIndex;
            }
        },
        leave: function (node) {
            if (BRANCH_NODES[node.type]) {
                var loc = source.locate(node.loc.start.line, node.loc.start.column);
                if (!loc.isExcluded) {
                    var fileInfo = source.ensureFileInfo(loc.filename);
                    var branchInfo = new BranchInfo(node._branchId, node.type, node.loc);
                    switch (node.type) {
                        case 'LogicalExpression':
                            branchInfo.addThread({id: 0, location: findFirstLoc(node.right)});
                            branchInfo.addThread({id: 1, location: findFirstLoc(node.left)});
                            node.left = _this._createCoverageCounterExpression(
                                loc.relativeFilename, branchInfo.getId(), 0, 1, node.left
                            );
                            break;
                        case 'ConditionalExpression':
                            branchInfo.addThread({id: 0, location: findFirstLoc(node.consequent)});
                            branchInfo.addThread({id: 1, location: findFirstLoc(node.alternate)});
                            node.test = _this._createCoverageCounterExpression(
                                loc.relativeFilename, branchInfo.getId(), 0, 1, node.test
                            );
                            break;
                        case 'IfStatement':
                            var consequentLoc = findFirstLoc(node.consequent) || node.loc;
                            branchInfo.addThread({id: 0, location: consequentLoc});
                            node.consequent.body.unshift(
                                _this._createCoverageCounterStatement(loc.relativeFilename, branchInfo.getId(), 0)
                            );
                            var alternateLoc = findFirstLoc(node.alternate) || {
                                start: consequentLoc.end,
                                end: consequentLoc.end
                            };
                            branchInfo.addThread({id: 1, location: alternateLoc});
                            node.alternate.body.unshift(
                                _this._createCoverageCounterStatement(loc.relativeFilename, branchInfo.getId(), 1)
                            );
                            break;
                        case 'SwitchStatement':
                            node.cases.forEach(function (switchCase, i) {
                                branchInfo.addThread({id: i, location: switchCase.loc});
                                switchCase.consequent.unshift(
                                    _this._createCoverageCounterStatement(loc.relativeFilename, branchInfo.getId(), i)
                                );
                            });
                            break;
                    }
                    fileInfo.addBranchInfo(branchInfo);
                    fileInfo.getStatInfo().registerBranchId(branchInfo.getId(), branchInfo.getThreads().length);
                }
            }
        }
    });
};

BranchCounters.prototype._createCoverageCounterExpression = function (
    filename, branchId, threadId, altThreadId, expr
) {
    var args = [
        {type: 'Literal', value: filename},
        {type: 'Literal', value: branchId},
        {type: 'Literal', value: threadId}
    ];
    if (altThreadId !== undefined) {
        args.push({type: 'Literal', value: altThreadId});
        args.push(expr);
    }
    return {
        type: 'CallExpression',
        callee: {
            type: 'MemberExpression',
            computed: false,
            object: {name: this._apiIObjectName, type: 'Identifier'},
            property: {name: 'countBranch', type: 'Identifier'}
        },
        arguments: args
    };
};

BranchCounters.prototype._createCoverageCounterStatement = function (filename, branchId, threadId) {
    return {
        type: 'ExpressionStatement',
        expression: this._createCoverageCounterExpression(filename, branchId, threadId)
    };
};

BranchCounters.prototype._wrapUsingCoverageCounterExpression = function (node, filename, branchId, threadId) {
    return {
        type: 'SequenceExpression',
        expressions: [this._createCoverageCounterExpression(filename, branchId, threadId), node]
    };
};

function findFirstLoc(node) {
    if (node.loc) {
        return node.loc;
    } else {
        var loc;
        estraverse.traverse(node, {
            enter: function (subNode) {
                if (subNode.loc) {
                    loc = subNode.loc;
                    return estraverse.VisitorOption.Break;
                }
            }
        });
        return loc;
    }
}

module.exports = BranchCounters;
