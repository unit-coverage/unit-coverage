var path = require('path');

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
        write('SF', process.cwd() + path.sep + fileInfo.getFilename());

        var stat = fileInfo.getStatInfo();
        var summary = stat.calcSummary();

        fileInfo.getFunctionIds().forEach(function (functionId) {
            var functionInfo = fileInfo.getFunctionInfo(functionId);
            write('FN', functionInfo.getLocation().start.line + ',' + functionInfo.getName());
            write('FNDA', stat.getFunctionCallCount(functionId) + ',' + functionInfo.getName());
        });
        write('FNF', summary.getFunctionCount());
        write('FNH', summary.getCoveredFunctionCount());

        stat.getLineNumbers().forEach(function (lineNumber) {
            write('DA', lineNumber + ',' + stat.getLineCallCount(lineNumber));
        });
        write('LF', summary.getLineCount());
        write('LH', summary.getCoveredLineCount());

        fileInfo.getBranchIds().forEach(function (branchId) {
            var branchInfo = fileInfo.getBranchInfo(branchId);
            branchInfo.getThreads().forEach(/** @param {BranchThread} thread */ function (thread) {
                write(
                    'BRDA',
                    thread.location.start.line + ',' +
                    branchId + ',' +
                    thread.id + ',' +
                    stat.getBranchThreadCallCount(branchId, thread.id)
                );
            });
        });
        write('BRF', summary.getBranchCount());
        write('BRH', summary.getCoveredBranchCount());

        writeEndOfRecord();
    });

    return result;
};
