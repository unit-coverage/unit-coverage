/**
 * @typedef {Object} SummaryData
 * @property {Number} lineCount
 * @property {Number} coveredLineCount
 * @property {Number} functionCount
 * @property {Number} coveredFunctionCount
 */

/**
 * @name Summary
 * @param {SummaryData} data
 * @constructor
 */
function Summary(data) {
    data = data || {};
    this._lineCount = data.lineCount || 0;
    this._coveredLineCount = data.coveredLineCount || 0;
    this._functionCount = data.functionCount || 0;
    this._coveredFunctionCount = data.coveredFunctionCount || 0;
}

/**
 * @returns {Number}
 */
Summary.prototype.getLineCount = function () {
    return this._lineCount;
};

/**
 * @returns {Number}
 */
Summary.prototype.getCoveredLineCount = function () {
    return this._coveredLineCount;
};

/**
 * @returns {Number}
 */
Summary.prototype.getFunctionCount = function () {
    return this._functionCount;
};

/**
 * @returns {Number}
 */
Summary.prototype.getCoveredFunctionCount = function () {
    return this._coveredFunctionCount;
};

/**
 * @param {Summary} summary
 */
Summary.prototype.add = function (summary) {
    this._lineCount += summary.getLineCount();
    this._coveredLineCount += summary.getCoveredLineCount();
    this._functionCount += summary.getFunctionCount();
    this._coveredFunctionCount += summary.getCoveredFunctionCount();
};

/**
 * @returns {Number}
 */
Summary.prototype.calcLineCoverage = function () {
    return this._lineCount === 0 ? 1 : this._coveredLineCount / this._lineCount;
};

/**
 * @returns {Number}
 */
Summary.prototype.calcFunctionCoverage = function () {
    return this._functionCount === 0 ? 1 : this._coveredFunctionCount / this._functionCount;
};

/**
 * @returns {Number}
 */
Summary.prototype.calcTotalCoverage = function () {
    var entityCount = this._lineCount + this._functionCount;
    var coveredEntityCount = this._coveredLineCount + this._coveredFunctionCount;
    return entityCount === 0 ? 1 : coveredEntityCount / entityCount;
};

/**
 * @returns {SummaryData}
 */
Summary.prototype.toJSON = function () {
    return {
        lineCount: this._lineCount,
        coveredLineCount: this._coveredLineCount,
        functionCount: this._functionCount,
        coveredFunctionCount: this._coveredFunctionCount
    };
};

/**
 * @param {SummaryData} json
 * @returns {Summary}
 */
Summary.fromJSON = function (json) {
    return new Summary(json);
};

module.exports = Summary;
