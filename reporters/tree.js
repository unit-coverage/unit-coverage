var mapTree = require('../lib/utils/map-tree');
var chalk = require('chalk');

/**
 * @param {CoverageInfo} coverageInfo
 */
module.exports = function (coverageInfo) {
    outputTree(mapTree.buildTree(coverageInfo), 0);
    console.log('');
    require('./summary')(coverageInfo);
};

/**
 * @param {Node} node
 * @param {Number} level
 */
function outputTree(node, level) {
    if (node.getName()) {
        console.log(
            (new Array(level + 1)).join('  ') +
            (node.isFile() ? chalk.green(node.getName()) : chalk.blue(node.getName())) + ' ' +
            formatNumber(Math.round(node.getSummary().calcTotalCoverage() * 100))
        );
    }
    node.getSubNodes().forEach(function (subNode) {
        outputTree(subNode, level + 1);
    });
}

function formatNumber(num) {
    return chalk.gray(num + '%');
}
