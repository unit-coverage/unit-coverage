var javascript = require('../javascript');

/**
 * Ensures BlockStatement for every child node.
 *
 * I.e. replaces "if (x) x++;" with "if (x) { x++; }".
 *
 * @constructor
 * @implements Processor
 */
function EnsureBlocks() {}

/**
 * @param {Source} source
 */
EnsureBlocks.prototype.process = function (source) {
    javascript.traverse(source.getAst(), {
        enter: function (context) {
            var node = context.node;
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
                case 'ArrowFunctionExpression':
                    if (node.expression) {
                        node.expression = false;
                        node.body = ensureBlock(wrapIntoReturn(node.body));
                    }
                    break;
            }
        }
    });
};

module.exports = EnsureBlocks;

function ensureBlock(node) {
    if (node && node.type === 'BlockStatement') {
        return node;
    } else {
        return {
            type: 'BlockStatement',
            body: node ? [node] : []
        };
    }
}

function wrapIntoReturn(node) {
    return {
        type: 'ReturnStatement',
        argument: node,
        loc: node.loc
    };
}
