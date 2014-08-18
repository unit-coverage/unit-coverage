var fs = require('fs');

module.exports = function (coverageInfo) {
    coverageInfo.getFileInfos().forEach(/** @param {FileInfo} fileInfo */ function (fileInfo) {
        write('TN', fileInfo.getTestName());
        write('SF', process.cwd() + '/' + fileInfo.getFilename());

        var stat = fileInfo.getStatInfo();
        var summary = stat.calcSummary();
        stat.getLineNumbers().forEach(function (lineNumber) {
            write('DA', lineNumber + ',' + stat.getLineCallCount(lineNumber));
        });
        write('LF', summary.getLineCount());
        write('LH', summary.getCoveredLineCount());

        writeEndOfRecord();
    });
};

function write(key, value) {
    console.log(key + ':' + value);
}

function writeEndOfRecord() {
    console.log('end_of_record');
}
