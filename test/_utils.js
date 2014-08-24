var globalVarPrefix = '___sepCoverage';
var stripAnsi = require('strip-ansi');
var fs = require('fs');

require('chai').should();

var consoleContent = '';
var consoleLog = console.log;
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
        return global.___sepCoverage___.getCoverageData();
    },
    captureConsole: function () {
        consoleContent = '';
        console.log = function (str) {
            consoleContent += str + '\n';
        };
    },
    endCaptureConsole: function () {
        console.log = consoleLog;
        return consoleContent;
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
