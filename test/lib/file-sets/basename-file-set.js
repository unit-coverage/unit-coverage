var BasenameFileSet = require('../../../lib/file-sets/basename-file-set');

describe('BasenameFileSet', function () {
    var basenameFileSet = new BasenameFileSet();

    describe('configure()', function () {
        it('should not thow any error', function () {
            basenameFileSet.configure({});
        });
    });

    describe('getTestName()', function () {
        it('should return filename without path', function () {
            basenameFileSet.getTestName(process.cwd() + '/filename').should.equal('filename');
        });

        it('should return filename without extension', function () {
            basenameFileSet.getTestName(process.cwd() + '/filename.js').should.equal('filename');
        });

        it('should return filename without multiple extensions', function () {
            basenameFileSet.getTestName(process.cwd() + '/filename.xxx.js').should.equal('filename');
        });
    });
});
