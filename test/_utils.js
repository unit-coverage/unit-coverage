var globalVarPrefix = '___unitCoverage';
var stripAnsi = require('strip-ansi');
var fs = require('fs');

require('chai').should();

var fsReadFileSync = fs.readFileSync;

module.exports = {
    cleanupGlobal: function () {
        for (var i in global) {
            if (global.hasOwnProperty(i)) {
                if (i.indexOf(globalVarPrefix) === 0) {
                    delete global[i];
                }
            }
        }
    },
    getMap: function () {
        return global.___unitCoverage___.getCoverageData();
    },
    uncolor: function (str) {
        return stripAnsi(str);
    },
    stubReadFile: function (fileContents) {
        fs.readFileSync = function (filename, encoding) {
            if (!fileContents.hasOwnProperty(filename)) {
                return fsReadFileSync.call(fs, filename, encoding);
            }
            return fileContents[filename];
        };
    },
    unstubReadFile: function () {
        fs.readFileSync = fsReadFileSync;
    }
};
