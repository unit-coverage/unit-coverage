var Source = require('../../lib/source');
var SimpleFileSet = require('../../lib/file-sets/simple-file-set');
var CoverageInfo = require('../../lib/obj/coverage-info');
var FileInfo = require('../../lib/obj/file-info');
var StatInfo = require('../../lib/obj/stat-info');

describe('Source', function () {
    var source;
    beforeEach(function () {
        source = new Source(process.cwd(), process.cwd() + '/tmp/file.js', 'x++;', [], new SimpleFileSet());
    });

    describe('getRootPath()', function () {
        it('should return given root path', function () {
            source.getRootPath().should.equal(process.cwd());
        });
    });

    describe('getFilename()', function () {
        it('should return given filename', function () {
            source.getFilename().should.equal(process.cwd() + '/tmp/file.js');
        });
    });

    describe('locate()', function () {
        it('should return location info', function () {
            source.locate(1, 0).should.deep.equal({
                filename: process.cwd() + '/tmp/file.js',
                testName: 'default',
                relativeFilename: 'tmp/file.js',
                isExcluded: false,
                line: 1,
                column: 0
            });
        });

        it('should process excludes for location info', function () {
            new Source(process.cwd(), process.cwd() + '/tmp/file.js', 'x++;', ['tmp/file.js'], new SimpleFileSet())
                .locate(1, 0).should.deep.equal({
                    filename: process.cwd() + '/tmp/file.js',
                    testName: 'default',
                    relativeFilename: 'tmp/file.js',
                    isExcluded: true,
                    line: 1,
                    column: 0
                });
        });

        it('should process masked excludes for location info', function () {
            new Source(process.cwd(), process.cwd() + '/tmp/file.js', 'x++;', ['tmp/**'], new SimpleFileSet())
                .locate(1, 0).should.deep.equal({
                    filename: process.cwd() + '/tmp/file.js',
                    testName: 'default',
                    relativeFilename: 'tmp/file.js',
                    isExcluded: true,
                    line: 1,
                    column: 0
                });
        });

        it('should process regex excludes for location info', function () {
            new Source(process.cwd(), process.cwd() + '/tmp/file.js', 'x++;', [/.*/], new SimpleFileSet())
                .locate(1, 0).should.deep.equal({
                    filename: process.cwd() + '/tmp/file.js',
                    testName: 'default',
                    relativeFilename: 'tmp/file.js',
                    isExcluded: true,
                    line: 1,
                    column: 0
                });
        });
    });

    describe('getAst()', function () {
        it('should return esprima Program node', function () {
            source.getAst().type.should.equal('Program');
        });
    });

    describe('getCoverageInfo()', function () {
        it('should return instance of CoverageInfo', function () {
            source.getCoverageInfo().should.be.instanceof(CoverageInfo);
        });
    });

    describe('ensureFileInfo()', function () {
        it('should create new FileInfo instance', function () {
            source.ensureFileInfo('2.js').should.be.instanceof(FileInfo);
        });

        it('should pass new StatInfo object', function () {
            source.ensureFileInfo('2.js').getStatInfo().should.be.instanceof(StatInfo);
        });

        it('should not recreate FileInfos', function () {
            source.ensureFileInfo('2.js').should.equal(source.ensureFileInfo('2.js'));
        });
    });
});
