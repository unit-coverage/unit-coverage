var chalk = require('chalk');

/**
 * @param {CoverageInfo} coverageInfo
 */
module.exports = function (coverageInfo) {
    var summary = coverageInfo.calcSummary();
    console.log(chalk.blue('Lines') + ' ' + formatNumber(Math.round(summary.calcLineCoverage() * 100)));
    console.log(chalk.blue('Functions') + ' ' + formatNumber(Math.round(summary.calcFunctionCoverage() * 100)));
    console.log(chalk.blue('Branches') + ' ' + formatNumber(Math.round(summary.calcBranchCoverage() * 100)));
    console.log(chalk.blue('Total') + ' ' + formatNumber(Math.round(summary.calcTotalCoverage() * 100)));
};

function formatNumber(num) {
    return chalk.gray(num + '%');
}
