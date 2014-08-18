var FileInfo = require('./file-info');
var Summary = require('./summary');

/**
 * @name CoverageInfo
 * @constructor
 */
function CoverageInfo() {
    this._fileInfos = {};
}

/**
 * @returns {String[]}
 */
CoverageInfo.prototype.getFilenames = function () {
    return Object.keys(this._fileInfos);
};

/**
 * @param {String} filename
 * @returns {String}
 */
CoverageInfo.prototype.getFileInfo = function (filename) {
    return this._fileInfos[filename];
};

/**
 * @returns {FileInfo[]}
 */
CoverageInfo.prototype.getFileInfos = function () {
    var fileInfos = this._fileInfos;
    return Object.keys(fileInfos).reduce(function (arr, key) {
        arr.push(fileInfos[key]);
        return arr;
    }, []);
};

/**
 * @param {FileInfo} fileInfo
 */
CoverageInfo.prototype.addFileInfo = function (fileInfo) {
    this._fileInfos[fileInfo.getFilename()] = fileInfo;
};

/**
 * @returns {Summary}
 */
CoverageInfo.prototype.calcSummary = function () {
    var summary = new Summary();
    this.getFileInfos().forEach(/** @param {FileInfo} fileInfo */ function (fileInfo) {
        summary.add(fileInfo.getStatInfo().calcSummary());
    });
    return summary;
};

CoverageInfo.prototype.toJSON = function () {
    var files = this._fileInfos;
    return Object.keys(files).reduce(function (obj, filename) {
        obj[filename] = files[filename].toJSON();
        return obj;
    }, {});
};

CoverageInfo.fromJSON = function (json) {
    var result = new CoverageInfo();
    Object.keys(json).forEach(function (filename) {
        result._fileInfos[filename] = FileInfo.fromJSON(json[filename]);
    });
    return result;
};

module.exports = CoverageInfo;
