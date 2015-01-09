var StatInfo = require('./stat-info');
var FunctionInfo = require('./function-info');
var BranchInfo = require('./branch-info');

/**
 * @param {Object} data
 * @param {String} data.filename
 * @param {String} data.testName
 * @param {StatInfo} data.stat
 * @param {StatInfo} data.initStat
 * @param {FunctionInfo[]} data.functions
 * @param {BranchInfo[]} data.branches
 * @constructor
 */
function FileInfo(data) {
    data = data || {};
    this._filename = data.filename;
    this._testName = data.testName;
    this._stat = data.stat ? data.stat : new StatInfo();
    this._initStat = data.initStat ? data.initStat : new StatInfo();
    this._functions = {};
    if (data.functions) {
        data.functions.forEach(function (functionInfo) {
            this.addFunctionInfo(functionInfo);
        }, this);
    }
    this._branches = {};
    if (data.branches) {
        data.branches.forEach(function (branchInfo) {
            this.addBranchInfo(branchInfo);
        }, this);
    }
}

/**
 * @returns {String}
 */
FileInfo.prototype.getFilename = function () {
    return this._filename;
};

/**
 * @returns {String}
 */
FileInfo.prototype.getTestName = function () {
    return this._testName;
};

/**
 * @returns {StatInfo}
 */
FileInfo.prototype.getStatInfo = function () {
    return this._stat;
};

/**
 * @returns {StatInfo}
 */
FileInfo.prototype.getInitStatInfo = function () {
    return this._initStat;
};

/**
 * @param {FunctionInfo} functionInfo
 */
FileInfo.prototype.addFunctionInfo = function (functionInfo) {
    this._functions[functionInfo.getId()] = functionInfo;
};

/**
 * @param {Number} functionId
 * @returns {FunctionInfo}
 */
FileInfo.prototype.getFunctionInfo = function (functionId) {
    return this._functions[functionId];
};

/**
 * @returns {Number[]}
 */
FileInfo.prototype.getFunctionIds = function () {
    return Object.keys(this._functions).map(Number);
};

/**
 * @param {BranchInfo} branchInfo
 */
FileInfo.prototype.addBranchInfo = function (branchInfo) {
    this._branches[branchInfo.getId()] = branchInfo;
};

/**
 * @param {Number} branchId
 * @returns {BranchInfo}
 */
FileInfo.prototype.getBranchInfo = function (branchId) {
    return this._branches[branchId];
};

/**
 * @returns {Number[]}
 */
FileInfo.prototype.getBranchIds = function () {
    return Object.keys(this._branches).map(Number);
};

FileInfo.prototype.toJSON = function () {
    var functions = this._functions;
    var branches = this._branches;
    return {
        filename: this._filename,
        testName: this._testName,
        stat: this._stat.toJSON(),
        initStat: this._initStat.toJSON(),
        meta: {
            functions: Object.keys(functions).reduce(function (obj, functionId) {
                obj[functionId] = functions[functionId].toJSON();
                return obj;
            }, {}),
            branches: Object.keys(branches).reduce(function (obj, branchId) {
                obj[branchId] = branches[branchId].toJSON();
                return obj;
            }, {})
        }
    };
};

FileInfo.fromJSON = function (json) {
    return new FileInfo({
        filename: json.filename,
        testName: json.testName,
        stat: new StatInfo(json.stat),
        initStat: new StatInfo(json.initStat),
        functions: Object.keys(json.meta.functions).map(function (fid) {
            return FunctionInfo.fromJSON(json.meta.functions[fid]);
        }),
        branches: Object.keys(json.meta.branches).map(function (bid) {
            return BranchInfo.fromJSON(json.meta.branches[bid]);
        })
    });
};

module.exports = FileInfo;
