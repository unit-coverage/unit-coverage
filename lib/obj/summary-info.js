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
 * @param {SummaryInfo} summary
 */
SummaryInfo.prototype.add = function (summary) {
    this._lineCount += summary.getLineCount();
    this._coveredLineCount += summary.getCoveredLineCount();
    this._functionCount += summary.getFunctionCount();
    this._coveredFunctionCount += summary.getCoveredFunctionCount();
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
SummaryInfo.prototype.calcTotalCoverage = function () {
    var entityCount = this._lineCount + this._functionCount;
    var coveredEntityCount = this._coveredLineCount + this._coveredFunctionCount;
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
        coveredFunctionCount: this._coveredFunctionCount
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
