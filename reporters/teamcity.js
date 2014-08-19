/**
 * @param {CoverageInfo} coverageInfo
 */
module.exports = function (coverageInfo) {
    var summary = coverageInfo.calcSummary();

    console.log('##teamcity[blockOpened name=\'Code Coverage SummaryInfo\']');

    var linePercentage = (summary.calcLineCoverage() * 100).toFixed(2);

    console.log(formatKey(linePercentage, 'CodeCoverageB'));

    console.log(formatKey(summary.getCoveredLineCount(), 'CodeCoverageAbsLCovered'));
    console.log(formatKey(summary.getLineCount(), 'CodeCoverageAbsLTotal'));
    console.log(formatKey(linePercentage, 'CodeCoverageL'));

    console.log(formatKey(summary.getCoveredFunctionCount(), 'CodeCoverageAbsMCovered'));
    console.log(formatKey(summary.getFunctionCount(), 'CodeCoverageAbsMTotal'));
    console.log(formatKey((summary.calcFunctionCoverage() * 100).toFixed(2), 'CodeCoverageM'));

    console.log('##teamcity[blockClosed name=\'Code Coverage SummaryInfo\']');
};

function formatKey(value, teamcityVar) {
    return '##teamcity[buildStatisticValue key=\'' + teamcityVar + '\' value=\'' + value + '\']';
}
