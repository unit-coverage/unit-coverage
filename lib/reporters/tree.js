var mapTree = require('../utils/map-tree');
var chalk = require('chalk');

/**
 * @param {CoverageInfo} coverageInfo
 */
module.exports = function (coverageInfo) {
    var result = formatTree(mapTree.buildTree(coverageInfo), 0);
    result += '\n';
    result += require('./summary')(coverageInfo);
    return result;
};

/**
 * @param {Node} node
 * @param {Number} level
 */
function formatTree(node, level) {
    var result = '';
    if (node.getName()) {
        result +=
            (new Array(level + 1)).join('  ') +
            (node.isFile() ? chalk.green(node.getName()) : chalk.blue(node.getName())) + ' ' +
            formatNumber(Math.round(node.getSummary().calcTotalCoverage() * 100)) + '\n';
    }
    node.getSubNodes().forEach(function (subNode) {
        result += formatTree(subNode, level + 1);
    });
    return result;
}

function formatNumber(num) {
    return chalk.gray(num + '%');
}
