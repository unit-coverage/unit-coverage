var fs = require('fs');

module.exports = function (map) {
    Object.keys(map).forEach(function (filename) {
        var data = map[filename];
        write('TN', data.setName);
        write('SF', fs.realpathSync(filename));

        var lines = data.lines;
        var lineKeys = Object.keys(lines);
        lineKeys.forEach(function (lineNumber) {
            write('DA', lineNumber + ',' + lines[lineNumber]);
        });
        write('LF', lineKeys.length);
        write('LH', lineKeys.reduce(function (res, key) {
            return res + (lines[key] > 0 ? 1 : 0);
        }, 0));

        writeEndOfRecord();
    });
};

function write(key, value) {
    console.log(key + ':' + value);
}

function writeEndOfRecord() {
    console.log('end_of_record');
}
