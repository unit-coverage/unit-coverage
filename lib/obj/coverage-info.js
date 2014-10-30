var FileInfo = require('./file-info');
var Summary = require('./summary-info');

/**
 * @name CoverageInfo
 * @param {FileInfo[]} [files]
 * @constructor
 */
function CoverageInfo(files) {
    this._fileInfos = {};
    if (files) {
        files.forEach(function (fileInfo) {
            this.addFileInfo(fileInfo);
        }, this);
    }
}

/**
 * @returns {String[]}
 */
CoverageInfo.prototype.getFilenames = function () {
    return Object.keys(this._fileInfos);
};

/**
 * @param {String} filename
 * @returns {FileInfo}
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
 * @returns {SummaryInfo}
 */
CoverageInfo.prototype.calcSummary = function () {
    var summary = new Summary();
    this.getFileInfos().forEach(/** @param {FileInfo} fileInfo */ function (fileInfo) {
        summary.add(fileInfo.getStatInfo().calcSummary());
    });
    return summary;
};

/**
 * @param {CoverageInfo} coverageInfo
 */
CoverageInfo.prototype.add = function (coverageInfo) {
    coverageInfo.getFileInfos().forEach(this.addFileInfo.bind(this));
};

CoverageInfo.prototype.toJSON = function () {
    var files = this._fileInfos;
    return Object.keys(files).reduce(function (obj, filename) {
        obj[filename] = files[filename].toJSON();
        return obj;
    }, {});
};

CoverageInfo.fromJSON = function (json) {
    return new CoverageInfo(Object.keys(json).map(function (filename) {
        return FileInfo.fromJSON(json[filename]);
    }));
};

module.exports = CoverageInfo;
