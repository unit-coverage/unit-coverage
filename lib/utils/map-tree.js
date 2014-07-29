module.exports.buildTree = function (map) {
    var tree = {name: '', path: '', lines: 0, coveredLines: 0, nodes: {}};
    Object.keys(map).forEach(function (filename) {
        var fileInfo = map[filename];
        var lineList = fileInfo.lines;
        var lineCount = 0;
        var coveredLineCount = 0;
        Object.keys(lineList).forEach(function (line) {
            lineCount++;
            if (lineList[line] > 0) {
                coveredLineCount++;
            }
        });
        var currentThread = tree;
        var filenameBits = filename.split('/');
        var filenamePath = [];
        var filenameBit;
        do {
            currentThread.lines += lineCount;
            currentThread.coveredLines += coveredLineCount;
            filenameBit = filenameBits.shift();
            if (filenameBit) {
                filenamePath.push(filenameBit);
                if (!currentThread.nodes[filenameBit]) {
                    currentThread.nodes[filenameBit] = {
                        name: filenameBit,
                        path: filenamePath.join('/'),
                        lines: 0, coveredLines: 0, nodes: {}
                    }
                }
                currentThread = currentThread.nodes[filenameBit];
            }
        } while (filenameBit);
        currentThread.isFile = true;
    });
    return tree;
};
