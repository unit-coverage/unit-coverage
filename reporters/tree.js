var mapTree = require('../lib/utils/map-tree');
var chalk = require('chalk');

module.exports = function (map) {
    outputTree(mapTree.buildTree(map), 0)
};

function outputTree(tree, level) {
    if (tree.name) {
        console.log((new Array(level + 1)).join('  ') +
            (tree.isFile ? chalk.green(tree.name) : chalk.blue(tree.name)) + ' ' +
            (tree.lines ? formatNumber(Math.round(tree.coveredLines * 100 / tree.lines)) : '')
        );
    }
    Object.keys(tree.nodes).forEach(function (key) {
        outputTree(tree.nodes[key], level + 1);
    });
    if (!tree.name) {
        console.log(chalk.blue('Total') + ' ' +
            (tree.lines ? formatNumber(Math.round(tree.coveredLines * 100 / tree.lines)) : '')
        );
    }
}

function formatNumber(num) {
    return chalk.gray(num + '%');
}
