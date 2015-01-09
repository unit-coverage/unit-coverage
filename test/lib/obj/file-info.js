var should = require('chai').should();
var FileInfo = require('../../../lib/obj/file-info');
var StatInfo = require('../../../lib/obj/stat-info');
var FunctionInfo = require('../../../lib/obj/function-info');
var BranchInfo = require('../../../lib/obj/branch-info');

describe('StatInfo', function () {
    var location = {
        start: {line: 1, column: 0},
        end: {line: 3, column: 5}
    };
    var fileInfo;
    beforeEach(function () {
        fileInfo = new FileInfo({filename: '1.js', testName: '1'});
    });

    describe('constructor()', function () {
        it('should accept no arguments', function () {
            var fi = new FileInfo();
            should.equal(fi.getFilename(), undefined);
            should.equal(fi.getTestName(), undefined);
        });
    });

    describe('getFilename()', function () {
        it('should return given filename', function () {
            fileInfo.getFilename().should.equal('1.js');
        });
    });

    describe('getTestName()', function () {
        it('should return given test name', function () {
            fileInfo.getTestName().should.equal('1');
        });
    });

    describe('getStatInfo()', function () {
        it('should return instance of StatInfo', function () {
            fileInfo.getStatInfo().should.be.instanceof(StatInfo);
        });
        it('should return given StatInfo', function () {
            var statInfo = new StatInfo();
            fileInfo = new FileInfo({filename: '1.js', testName: '1', stat: statInfo});
            fileInfo.getStatInfo().should.equal(statInfo);
        });
    });

    describe('getInitStatInfo()', function () {
        it('should return instance of StatInfo', function () {
            fileInfo.getInitStatInfo().should.be.instanceof(StatInfo);
        });
        it('should return given StatInfo', function () {
            var statInfo = new StatInfo();
            fileInfo = new FileInfo({filename: '1.js', testName: '1', initStat: statInfo});
            fileInfo.getInitStatInfo().should.equal(statInfo);
        });
    });

    describe('addFunctionInfo()', function () {
        it('should add function info', function () {
            var functionInfo = new FunctionInfo(1, 'f', location);
            fileInfo.addFunctionInfo(functionInfo);
            fileInfo.getFunctionInfo(1).should.equal(functionInfo);
        });
    });

    describe('getFunctionInfo()', function () {
        it('should return given function info', function () {
            var functionInfo = new FunctionInfo(1, 'f', location);
            fileInfo.addFunctionInfo(functionInfo);
            fileInfo.getFunctionInfo(1).should.equal(functionInfo);
        });

        it('should return undefined for missing function info', function () {
            (fileInfo.getFunctionInfo(2) === undefined).should.equal(true);
        });
    });

    describe('getFunctionIds()', function () {
        it('should return empty array by default', function () {
            fileInfo.getFunctionIds().should.deep.equal([]);
        });

        it('should return function ids', function () {
            fileInfo.addFunctionInfo(new FunctionInfo(1, 'f', location));
            fileInfo.addFunctionInfo(new FunctionInfo(2, 'y', location));
            fileInfo.getFunctionIds().should.deep.equal([1, 2]);
        });
    });

    describe('addBranchInfo()', function () {
        it('should add function info', function () {
            var branchInfo = new BranchInfo(1, 'if', location, []);
            fileInfo.addBranchInfo(branchInfo);
            fileInfo.getBranchInfo(1).should.equal(branchInfo);
        });
    });

    describe('getBranchInfo()', function () {
        it('should return given function info', function () {
            var branchInfo = new BranchInfo(1, 'if', location, []);
            fileInfo.addBranchInfo(branchInfo);
            fileInfo.getBranchInfo(1).should.equal(branchInfo);
        });
        it('should return undefined for missing branch info', function () {
            (fileInfo.getBranchInfo(2) === undefined).should.equal(true);
        });
    });

    describe('getBranchIds()', function () {
        it('should return empty array by default', function () {
            fileInfo.getBranchIds().should.deep.equal([]);
        });

        it('should return function ids', function () {
            fileInfo.addBranchInfo(new BranchInfo(1, 'if', location, []));
            fileInfo.addBranchInfo(new BranchInfo(2, 'switch', location, []));
            fileInfo.getBranchIds().should.deep.equal([1, 2]);
        });
    });

    describe('fromJSON()', function () {
        it('should accept basic info', function () {
            var fileInfo = FileInfo.fromJSON({
                filename: '1.js',
                testName: '1',
                stat: {lines: {}, functions: {}, branches: {}},
                meta: {functions: {}, branches: {}}
            });
            fileInfo.getFilename().should.equal('1.js');
            fileInfo.getTestName().should.equal('1');
        });

        it('should accept stat info', function () {
            FileInfo.fromJSON({
                filename: '1.js',
                testName: '1',
                stat: {lines: {1: 0, 2: 1, 5: 6}, functions: {}, branches: {}},
                meta: {functions: {}, branches: {}}
            }).getStatInfo().getLineNumbers().should.deep.equal([1, 2, 5]);
        });

        it('should accept init stat info', function () {
            FileInfo.fromJSON({
                filename: '1.js',
                testName: '1',
                initStat: {lines: {1: 0, 2: 1, 5: 6}, functions: {}, branches: {}},
                stat: {lines: {}, functions: {}, branches: {}},
                meta: {functions: {}, branches: {}}
            }).getInitStatInfo().getLineNumbers().should.deep.equal([1, 2, 5]);
        });

        it('should accept function metadata', function () {
            var functionInfo = FileInfo.fromJSON({
                filename: '1.js',
                testName: '1',
                stat: {lines: {}, functions: {}, branches: {}},
                meta: {functions: {
                    1: {
                        id: 1,
                        name: 'f',
                        location: location
                    }
                }, branches: {}}
            }).getFunctionInfo(1);
            functionInfo.getId().should.equal(1);
            functionInfo.getName().should.equal('f');
            functionInfo.getLocation().should.deep.equal(location);
        });

        it('should accept branch metadata', function () {
            var branchInfo = FileInfo.fromJSON({
                filename: '1.js',
                testName: '1',
                stat: {lines: {}, functions: {}, branches: {}},
                meta: {functions: {}, branches: {
                    1: {
                        id: 1,
                        type: 'if',
                        location: location,
                        threads: [{
                            id: 0,
                            location: location
                        }]
                    }
                }}
            }).getBranchInfo(1);
            branchInfo.getId().should.equal(1);
            branchInfo.getType().should.equal('if');
            branchInfo.getLocation().should.deep.equal(location);
            branchInfo.getThreads().should.deep.equal([{id: 0, location: location}]);
        });
    });

    describe('toJSON()', function () {
        it('should produce json', function () {
            new FileInfo({
                filename: '1.js',
                testName: '1',
                stat: new StatInfo({
                    lines: {1: 1}
                }),
                initStat: new StatInfo({
                    lines: {2: 0}
                }),
                functions: [new FunctionInfo(1, 'f', location)],
                branches: [new BranchInfo(1, 'if', location, [])]
            }).toJSON().should.deep.equal({
                filename: '1.js',
                testName: '1',
                stat: {lines: {1: 1}, functions: {}, branches: {}},
                initStat: {lines: {2: 0}, functions: {}, branches: {}},
                meta: {functions: {
                    1: {
                        id: 1,
                        name: 'f',
                        location: location
                    }
                }, branches: {
                    1: {
                        id: 1,
                        type: 'if',
                        location: location,
                        threads: []
                    }
                }}
            });
        });
    });
});
