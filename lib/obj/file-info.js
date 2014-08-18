var StatInfo = require('./stat-info');
var FunctionInfo = require('./function-info');

/**
 * @param {String} filename
 * @param {String} testName
 * @constructor
 */
function FileInfo(filename, testName) {
    this._filename = filename;
    this._testName = testName;
    this._stat = null;
    this._initStat = null;
    this._functions = {};
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
 * @param {StatInfo} stat
 */
FileInfo.prototype.setStatInfo = function (stat) {
    this._stat = stat;
};

/**
 * @returns {StatInfo}
 */
FileInfo.prototype.getStatInfo = function () {
    return this._stat;
};

/**
 * @param {StatInfo} stat
 */
FileInfo.prototype.setInitStatInfo = function (stat) {
    this._initStat = stat;
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
 * @returns {{filename: String, testName: String, stat: {lines: {}, functions: {}}, meta: {functions: {}}}}
 */
FileInfo.prototype.toJSON = function () {
    var functions = this._functions;
    return {
        filename: this._filename,
        testName: this._testName,
        stat: this._stat.toJSON(),
        meta: {
            functions: Object.keys(functions).reduce(function (obj, fid) {
                obj[fid] = functions[fid].toJSON();
                return obj;
            }, {})
        }
    };
};

FileInfo.fromJSON = function (json) {
    var result = new FileInfo(json.filename, json.testName);
    result.setStatInfo(StatInfo.fromJSON(json.stat));
    if (json.initStat) {
        result.setInitStatInfo(StatInfo.fromJSON(json.initStat));
    }
    var functions = json.meta.functions;
    Object.keys(functions).forEach(function (fid) {
        result.addFunctionInfo(FunctionInfo.fromJSON(functions[fid]));
    });
    return result;
};

module.exports = FileInfo;
