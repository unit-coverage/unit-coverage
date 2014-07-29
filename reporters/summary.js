var mapTree = require('../lib/utils/map-tree');
var chalk = require('chalk');

module.exports = function (map) {
    var tree = mapTree.buildTree(map);
    console.log(chalk.blue('Total') + ' ' + (tree.lines ? formatNumber(Math.round(tree.coveredLines * 100 / tree.lines)) : ''));
};

function formatNumber(num) {
    return chalk.gray(num + '%');
}
