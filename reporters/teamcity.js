var mapTree = require('../lib/utils/map-tree');

/**
 * @param {CoverageInfo} coverageInfo
 */
module.exports = function (coverageInfo) {
    var summary = coverageInfo.calcSummary();

    var linePercentage = (summary.calcLineCoverage() * 100).toFixed(2);

    console.log('##teamcity[blockOpened name=\'Code Coverage Summary\']');

    console.log(formatKey(linePercentage, 'CodeCoverageB'));
    console.log(formatKey(summary.getCoveredLineCount(), 'CodeCoverageAbsLCovered'));
    console.log(formatKey(summary.getLineCount(), 'CodeCoverageAbsLTotal'));
    console.log(formatKey(linePercentage, 'CodeCoverageL'));

    console.log('##teamcity[blockClosed name=\'Code Coverage Summary\']');
};

function formatKey(value, teamcityVar) {
    return '##teamcity[buildStatisticValue key=\'' + teamcityVar + '\' value=\'' + value + '\']';
}
