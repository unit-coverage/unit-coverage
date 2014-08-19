var Summary = require('./summary-info');

/**
 * @name StatInfo
 * @constructor
 */
function StatInfo() {
    this._lines = {};
    this._functions = {};
    this._summary = null;
}

/**
 * @param {Number} lineNumber
 */
StatInfo.prototype.registerLine = function (lineNumber) {
    this._lines[lineNumber] = 0;
};

/**
 * @returns {Number[]}
 */
StatInfo.prototype.getLineNumbers = function () {
    return Object.keys(this._lines).map(Number);
};

/**
 * @param {Number} lineNumber
 * @returns {Number|undefined}
 */
StatInfo.prototype.getLineCallCount = function (lineNumber) {
    return this._lines[lineNumber];
};

/**
 * @param {Number} functionId
 */
StatInfo.prototype.registerFunction = function (functionId) {
    this._functions[functionId] = 0;
};

/**
 * @returns {Number[]}
 */
StatInfo.prototype.getFunctionIds = function () {
    return Object.keys(this._functions).map(Number);
};

/**
 * @param {Number} functionId
 * @returns {Number|undefined}
 */
StatInfo.prototype.getFunctionCallCount = function (functionId) {
    return this._functions[functionId];
};

/**
 * @returns {SummaryInfo}
 */
StatInfo.prototype.calcSummary = function () {
    var stat = {
        lineCount: 0, coveredLineCount: 0,
        functionCount: 0, coveredFunctionCount: 0
    };

    var lines = this._lines;
    Object.keys(lines).forEach(function (line) {
        stat.lineCount++;
        if (lines[line] > 0) {
            stat.coveredLineCount++;
        }
    });

    var functions = this._functions;
    Object.keys(functions).forEach(function (functionId) {
        stat.functionCount++;
        if (functions[functionId] > 0) {
            stat.coveredFunctionCount++;
        }
    });

    return new Summary(stat);
};

/**
 * @returns {{lines: {}, functions: {}}}
 */
StatInfo.prototype.toJSON = function () {
    return {
        lines: this._lines,
        functions: this._functions
    };
};

/**
 * @param {{lines: {}, functions: {}}} json
 * @returns {StatInfo}
 */
StatInfo.fromJSON = function (json) {
    var result = new StatInfo();
    result._lines = json.lines;
    result._functions = json.functions;
    return result;
};

module.exports = StatInfo;
