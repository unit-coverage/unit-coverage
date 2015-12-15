var Summary = require('./summary-info');

/**
 * @name StatInfo
 * @constructor
 */
function StatInfo(data) {
    data = data || {};
    this._lines = data.lines || {};
    this._functions = data.functions || {};
    this._branches = data.branches || {};
}

/**
 * @param {Number} lineNumber
 */
StatInfo.prototype.registerLineNumber = function (lineNumber) {
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
StatInfo.prototype.registerFunctionId = function (functionId) {
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
 * @param {Number} branchId
 * @param {Number} threadCount
 */
StatInfo.prototype.registerBranchId = function (branchId, threadCount) {
    var threads = [];
    while (threadCount--) {
        threads.push(0);
    }
    this._branches[branchId] = threads;
};

/**
 * @returns {Number[]}
 */
StatInfo.prototype.getBranchIds = function () {
    return Object.keys(this._branches).map(Number);
};

/**
 * @param {Number} branchId
 * @returns {Number[]|undefined}
 */
StatInfo.prototype.getBranchThreadIds = function (branchId) {
    var branch = this._branches[branchId];
    if (branch) {
        return Object.keys(branch).map(Number);
    } else {
        return undefined;
    }
};

/**
 * @param {Number} branchId
 * @param {Number} threadId
 * @returns {Number|undefined}
 */
StatInfo.prototype.getBranchThreadCallCount = function (branchId, threadId) {
    return this._branches[branchId] ? this._branches[branchId][threadId] : undefined;
};

/**
 * @param {StatInfo} statInfo
 */
StatInfo.prototype.add = function(statInfo) {
    appendCounters(this._lines, statInfo._lines);
    appendCounters(this._functions, statInfo._functions);
    appendCounters(this._branches, statInfo._branches, appendThreads);
};

/**
 * @returns {SummaryInfo}
 */
StatInfo.prototype.calcSummary = function () {
    var stat = {
        lineCount: 0, coveredLineCount: 0,
        functionCount: 0, coveredFunctionCount: 0,
        branchCount: 0, coveredBranchCount: 0
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

    var branches = this._branches;
    Object.keys(branches).forEach(function (branchId) {
        stat.branchCount++;
        if (branches[branchId].every(function (callCount) { return callCount > 0; })) {
            stat.coveredBranchCount++;
        }
    });

    return new Summary(stat);
};

/**
 * @returns {{lines: {}, functions: {}, branches: {}}}
 */
StatInfo.prototype.toJSON = function () {
    return {
        lines: this._lines,
        functions: this._functions,
        branches: this._branches
    };
};

/**
 * @param {{lines: {}, functions: {}, branches: {}}} json
 * @returns {StatInfo}
 */
StatInfo.fromJSON = function (json) {
    return new StatInfo(json);
};

module.exports = StatInfo;

/**
 * Appends one counter stat to another.
 *
 * @param {Object} counters
 * @param {Object} newCounters
 * @param {Function} [appendFunction]
 */
function appendCounters(counters, newCounters, appendFunction) {
    for (var counterId in newCounters) {
        if (newCounters.hasOwnProperty(counterId)) {
            if (counterId in counters) {
                if (appendFunction) {
                    appendFunction(counters[counterId], newCounters[counterId]);
                } else {
                    counters[counterId] += newCounters[counterId];
                }
            } else {
                counters[counterId] = newCounters[counterId];
            }
        }
    }
}

/**
 * Appends thread one counter stat to another.
 *
 * @param {Number[]} threadCounters
 * @param {Number[]} newThreadCounters
 */
function appendThreads(threadCounters, newThreadCounters) {
    for (var i = 0; i < newThreadCounters.length; i++) {
        threadCounters[i] = (threadCounters[i] || 0) + newThreadCounters[i];
    }
}
