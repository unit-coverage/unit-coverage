module.exports = function (coverageInfo) {
    var result = '';

    function write(key, value) {
        result += key + ':' + value + '\n';
    }

    function writeEndOfRecord() {
        result += 'end_of_record\n';
    }

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

    return result;
};
