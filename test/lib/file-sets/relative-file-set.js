var RelativeFileSet = require('../../../lib/file-sets/relative-file-set');

describe('RelativeFileSet', function () {
    var relativeFileSet;
    var root = process.cwd();

    beforeEach(function () {
        relativeFileSet = new RelativeFileSet();
    });

    describe('getTestName()', function () {
        it('should return relative path by default', function () {
            relativeFileSet.getTestName(root + '/dir/file', root).should.equal('dir/file');
        });

        it('should strip suffix by default', function () {
            relativeFileSet.getTestName(root + '/dir/file.js', root).should.equal('dir/file');
        });

        it('should support "tests" option', function () {
            relativeFileSet.configure({tests: 'tests'});
            relativeFileSet.getTestName(root + '/tests/file', root).should.equal('file');
        });

        it('should support "sources" option', function () {
            relativeFileSet.configure({sources: 'sources'});
            relativeFileSet.getTestName(root + '/sources/file', root).should.equal('file');
        });

        it('should respect "tests" over "sources" option', function () {
            relativeFileSet.configure({sources: 'src', tests: 'src/tests'});
            relativeFileSet.getTestName(root + '/src/tests/file', root).should.equal('file');
            relativeFileSet.getTestName(root + '/src/file', root).should.equal('file');
        });

        it('should support "suffix" option', function () {
            relativeFileSet.configure({suffix: '-'});
            relativeFileSet.getTestName(root + '/file-x', root).should.equal('file');
        });

        it('should support empty "suffix" option', function () {
            relativeFileSet.configure({suffix: null});
            relativeFileSet.getTestName(root + '/file.x', root).should.equal('file.x');
        });
    });
});
