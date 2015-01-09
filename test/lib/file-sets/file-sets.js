var create = require('../../../lib/file-sets/file-sets').create;
var BasenameFileSet = require('../../../lib/file-sets/basename-file-set');
var RelativeFileSet = require('../../../lib/file-sets/relative-file-set');
var SimpleFileSet = require('../../../lib/file-sets/simple-file-set');

describe('file-sets', function () {
    describe('create()', function () {
        it('should return basename instance', function () {
            create('basename').should.be.instanceof(BasenameFileSet);
        });

        it('should return relative instance', function () {
            create('relative').should.be.instanceof(RelativeFileSet);
        });

        it('should return simple instance', function () {
            create('simple').should.be.instanceof(SimpleFileSet);
        });
    });
});
