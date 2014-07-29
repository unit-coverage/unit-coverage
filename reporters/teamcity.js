var mapTree = require('../lib/utils/map-tree');

module.exports = function (map) {
    var tree = mapTree.buildTree(map);

    var pecentage = tree.lines ? tree.coveredLines * 100 / tree.lines : 0;

    pecentage = pecentage.toFixed(2);

    console.log('##teamcity[blockOpened name=\'Code Coverage Summary\']');

    console.log(formatKey(pecentage, 'CodeCoverageB'));
    console.log(formatKey(tree.coveredLines, 'CodeCoverageAbsLCovered'));
    console.log(formatKey(tree.lines, 'CodeCoverageAbsLTotal'));
    console.log(formatKey(pecentage, 'CodeCoverageL'));

    console.log('##teamcity[blockClosed name=\'Code Coverage Summary\']');
};

function formatKey(value, teamcityVar) {
    return '##teamcity[buildStatisticValue key=\'' + teamcityVar + '\' value=\'' + value + '\']';
}
