var path = require('path');

function BasenameFileSet() {

}

BasenameFileSet.prototype.configure = function () {};

BasenameFileSet.prototype.getTestName = function (filename) {
    return path.basename(filename).split('.').shift();
};

module.exports = BasenameFileSet;
