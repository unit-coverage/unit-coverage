/**
 * @name SimpleFileSet
 * @implements FileSet
 * @constructor
 */
function SimpleFileSet() {}

SimpleFileSet.prototype.configure = function () {};

SimpleFileSet.prototype.getTestName = function () {
    return 'default';
};

module.exports = SimpleFileSet;
