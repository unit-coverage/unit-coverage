var path = require('path');

/**
 * @name BasenameFileSet
 * @implements FileSet
 * @constructor
 */
function BasenameFileSet() {}

BasenameFileSet.prototype.configure = function () {};

BasenameFileSet.prototype.getTestName = function (filename) {
    return path.basename(filename).split('.').shift();
};

module.exports = BasenameFileSet;
