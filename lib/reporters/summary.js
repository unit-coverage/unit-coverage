var chalk = require('chalk');

/**
 * @param {CoverageInfo} coverageInfo
 */
module.exports = function (coverageInfo) {
    var summary = coverageInfo.calcSummary();
    var result = '';
    result += chalk.blue('Lines') + ' ' + formatNumber(Math.round(summary.calcLineCoverage() * 100)) + '\n';
    result += chalk.blue('Functions') + ' ' + formatNumber(Math.round(summary.calcFunctionCoverage() * 100)) + '\n';
    result += chalk.blue('Branches') + ' ' + formatNumber(Math.round(summary.calcBranchCoverage() * 100)) + '\n';
    result += chalk.blue('Total') + ' ' + formatNumber(Math.round(summary.calcTotalCoverage() * 100)) + '\n';
    return result;
};

function formatNumber(num) {
    return chalk.gray(num + '%');
}
