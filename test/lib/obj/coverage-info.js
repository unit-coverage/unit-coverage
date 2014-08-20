var CoverageInfo = require('../../../lib/obj/coverage-info');
var FileInfo = require('../../../lib/obj/file-info');

describe('CoverageInfo', function () {
    describe('getFilenames()', function () {
        it('should return filename list', function () {
            new CoverageInfo([
                new FileInfo({filename: '1.js', testName: '1'}),
                new FileInfo({filename: '2.js', testName: '2'})
            ]).getFilenames().should.deep.equal(['1.js', '2.js']);
        });
    });

    describe('getFileInfo()', function () {
        it('should return given file info', function () {
            var fileInfo = new FileInfo({filename: '1.js', testName: '1'});
            new CoverageInfo([
                fileInfo,
                new FileInfo({filename: '2.js', testName: '2'})
            ]).getFileInfo('1.js').should.equal(fileInfo);
        });
    });

    describe('getFileInfos()', function () {
        it('should return given file infos', function () {
            new CoverageInfo([
                new FileInfo({filename: '1.js', testName: '1'}),
                new FileInfo({filename: '2.js', testName: '2'})
            ]).getFileInfos().map(function (fi) {
                return fi.getFilename();
            }).should.deep.equal(['1.js', '2.js']);
        });
    });

    describe('getFileInfo()', function () {
        it('should add file info', function () {
            var fileInfo = new FileInfo({filename: '1.js', testName: '1'});
            var coverageInfo = new CoverageInfo();
            coverageInfo.addFileInfo(fileInfo);
            coverageInfo.getFileInfo('1.js').should.equal(fileInfo);
        });
    });

    describe('calcSummary()', function () {
        it('should calc summary across all files', function () {
            var summary = CoverageInfo.fromJSON({
                '1.js': {
                    filename: '1.js',
                    testName: '1',
                    stat: {lines: {1: 1, 2: 0}, functions: {1: 1, 2: 0}, branches: {1: [0], 2: [0, 1], 3: [1, 1]}},
                    initStat: {lines: {}, functions: {}, branches: {}},
                    meta: {functions: {}, branches: {}}
                },
                '2.js': {
                    filename: '2.js',
                    testName: '2',
                    stat: {lines: {1: 1, 2: 0}, functions: {1: 1, 2: 0}, branches: {1: [0], 2: [0, 1], 3: [1, 1]}},
                    initStat: {lines: {}, functions: {}, branches: {}},
                    meta: {functions: {}, branches: {}}
                }
            }).calcSummary();

            summary.getLineCount().should.equal(4);
            summary.getCoveredLineCount().should.equal(2);
            summary.getFunctionCount().should.equal(4);
            summary.getCoveredFunctionCount().should.equal(2);
            summary.getBranchCount().should.equal(6);
            summary.getCoveredBranchCount().should.equal(2);
        });
    });

    describe('toJSON()', function () {
        it('should create valid json', function () {
            new CoverageInfo([
                new FileInfo({filename: '1.js', testName: '1'})
            ]).toJSON().should.deep.equal({
                '1.js': {
                    filename: '1.js',
                    testName: '1',
                    stat: {lines: {}, functions: {}, branches: {}},
                    initStat: {lines: {}, functions: {}, branches: {}},
                    meta: {
                        functions: {},
                        branches: {}
                    }
                }
            });
        });
    });

    describe('fromJSON()', function () {
        it('should create valid json', function () {
            var fileInfoJson = {
                filename: '1.js',
                testName: '1',
                stat: {lines: {}, functions: {}, branches: {}},
                initStat: {lines: {}, functions: {}, branches: {}},
                meta: {
                    functions: {},
                    branches: {}
                }
            };
            CoverageInfo.fromJSON({
                '1.js': fileInfoJson
            }).getFileInfo('1.js').toJSON().should.deep.equal(fileInfoJson);
        });
    });
});
