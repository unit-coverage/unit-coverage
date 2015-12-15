/**
 * @param {CoverageInfo} coverageInfo
 */
module.exports = function (coverageInfo) {
    return JSON.stringify(coverageInfo.toJSON());
};
