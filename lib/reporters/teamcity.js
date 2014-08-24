/**
 * @param {CoverageInfo} coverageInfo
 */
module.exports = function (coverageInfo) {
    var summary = coverageInfo.calcSummary();

    var result = '';

    result += '##teamcity[blockOpened name=\'Code Coverage SummaryInfo\']\n';

    var linePercentage = (summary.calcLineCoverage() * 100).toFixed(2);

    result += formatKey(linePercentage, 'CodeCoverageB') + '\n';

    result += formatKey(summary.getCoveredLineCount(), 'CodeCoverageAbsLCovered') + '\n';
    result += formatKey(summary.getLineCount(), 'CodeCoverageAbsLTotal') + '\n';
    result += formatKey(linePercentage, 'CodeCoverageL') + '\n';

    result += formatKey(summary.getCoveredFunctionCount(), 'CodeCoverageAbsMCovered') + '\n';
    result += formatKey(summary.getFunctionCount(), 'CodeCoverageAbsMTotal') + '\n';
    result += formatKey((summary.calcFunctionCoverage() * 100).toFixed(2), 'CodeCoverageM') + '\n';

    result += '##teamcity[blockClosed name=\'Code Coverage SummaryInfo\']\n';

    return result;
};

function formatKey(value, teamcityVar) {
    return '##teamcity[buildStatisticValue key=\'' + teamcityVar + '\' value=\'' + value + '\']';
}
