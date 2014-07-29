var path = require('path');

function BasenameFileSet() {

}

BasenameFileSet.prototype.getSetName = function (filename) {
    return path.basename(filename).split('.').shift();
};

module.exports = BasenameFileSet;
