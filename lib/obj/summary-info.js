/**
 * @typedef {Object} SummaryData
 * @property {Number} lineCount
 * @property {Number} coveredLineCount
 * @property {Number} functionCount
 * @property {Number} coveredFunctionCount
 */

/**
 * @name SummaryInfo
 * @param {SummaryData} data
 * @constructor
 */
function SummaryInfo(data) {
    data = data || {};
    this._lineCount = data.lineCount || 0;
    this._coveredLineCount = data.coveredLineCount || 0;
    this._functionCount = data.functionCount || 0;
    this._coveredFunctionCount = data.coveredFunctionCount || 0;
    this._branchCount = data.branchCount || 0;
    this._coveredBranchCount = data.coveredBranchCount || 0;
}

/**
 * @returns {Number}
 */
SummaryInfo.prototype.getLineCount = function () {
    return this._lineCount;
};

/**
 * @returns {Number}
 */
SummaryInfo.prototype.getCoveredLineCount = function () {
    return this._coveredLineCount;
};

/**
 * @returns {Number}
 */
SummaryInfo.prototype.getFunctionCount = function () {
    return this._functionCount;
};

/**
 * @returns {Number}
 */
SummaryInfo.prototype.getCoveredFunctionCount = function () {
    return this._coveredFunctionCount;
};

/**
 * @returns {Number}
 */
SummaryInfo.prototype.getBranchCount = function () {
    return this._branchCount;
};

/**
 * @returns {Number}
 */
SummaryInfo.prototype.getCoveredBranchCount = function () {
    return this._coveredBranchCount;
};

/**
 * @param {SummaryInfo} summary
 */
SummaryInfo.prototype.add = function (summary) {
    this._lineCount += summary.getLineCount();
    this._coveredLineCount += summary.getCoveredLineCount();
    this._functionCount += summary.getFunctionCount();
    this._coveredFunctionCount += summary.getCoveredFunctionCount();
    this._branchCount += summary.getBranchCount();
    this._coveredBranchCount += summary.getCoveredBranchCount();
};

/**
 * @returns {Number}
 */
SummaryInfo.prototype.calcLineCoverage = function () {
    return this._lineCount === 0 ? 1 : this._coveredLineCount / this._lineCount;
};

/**
 * @returns {Number}
 */
SummaryInfo.prototype.calcFunctionCoverage = function () {
    return this._functionCount === 0 ? 1 : this._coveredFunctionCount / this._functionCount;
};

/**
 * @returns {Number}
 */
SummaryInfo.prototype.calcBranchCoverage = function () {
    return this._branchCount === 0 ? 1 : this._coveredBranchCount / this._branchCount;
};

/**
 * @returns {Number}
 */
SummaryInfo.prototype.calcTotalCoverage = function () {
    var entityCount = this._lineCount + this._functionCount + this._branchCount;
    var coveredEntityCount = this._coveredLineCount + this._coveredFunctionCount + this._coveredBranchCount;
    return entityCount === 0 ? 1 : coveredEntityCount / entityCount;
};

/**
 * @returns {SummaryData}
 */
SummaryInfo.prototype.toJSON = function () {
    return {
        lineCount: this._lineCount,
        coveredLineCount: this._coveredLineCount,
        functionCount: this._functionCount,
        coveredFunctionCount: this._coveredFunctionCount,
        branchCount: this._branchCount,
        coveredBranchCount: this._coveredBranchCount
    };
};

/**
 * @param {SummaryData} json
 * @returns {SummaryInfo}
 */
SummaryInfo.fromJSON = function (json) {
    return new SummaryInfo(json);
};

module.exports = SummaryInfo;
