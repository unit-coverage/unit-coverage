var StatInfo = require('../../../lib/obj/stat-info');

describe('StatInfo', function () {
    var statInfo;
    beforeEach(function () {
        statInfo = new StatInfo();
    });

    describe('registerLineNumber()', function () {
        it('should add line to the list', function () {
            statInfo.registerLineNumber(1);
            statInfo.getLineNumbers().should.deep.equal([1]);
        });
        it('should not duplicate line numbers', function () {
            statInfo.registerLineNumber(1);
            statInfo.registerLineNumber(1);
            statInfo.getLineNumbers().should.deep.equal([1]);
        });
    });

    describe('getLineNumbers()', function () {
        it('should return given line numbers', function () {
            new StatInfo({
                lines: {
                    1: 0,
                    2: 0
                }
            }).getLineNumbers().should.deep.equal([1, 2]);
        });
    });

    describe('getLineCallCount()', function () {
        it('should return line call count', function () {
            new StatInfo({
                lines: {
                    1: 5
                }
            }).getLineCallCount(1).should.equal(5);
        });
    });

    describe('registerFunctionId()', function () {
        it('should register new function', function () {
            statInfo.registerFunctionId(5);
            statInfo.getFunctionIds().should.deep.equal([5]);
        });
    });

    describe('getFunctionIds()', function () {
        it('should return given function ids', function () {
            new StatInfo({
                functions: {
                    1: 0,
                    2: 0
                }
            }).getFunctionIds().should.deep.equal([1, 2]);
        });
    });

    describe('getFunctionCallCount()', function () {
        it('should return function call count', function () {
            new StatInfo({
                functions: {
                    1: 5
                }
            }).getFunctionCallCount(1).should.equal(5);
        });
    });

    describe('registerBranchId()', function () {
        it('should return register branch', function () {
            statInfo.registerBranchId(1, 3);
            statInfo.getBranchIds().should.deep.equal([1]);
            statInfo.getBranchThreadIds(1).should.deep.equal([0, 1, 2]);
        });
    });

    describe('getBranchIds()', function () {
        it('should return given branch ids', function () {
            new StatInfo({
                branches: {
                    1: [0],
                    2: [0]
                }
            }).getBranchIds().should.deep.equal([1, 2]);
        });
    });

    describe('getBranchThreadIds()', function () {
        it('should return given branch thread ids', function () {
            new StatInfo({
                branches: {
                    1: [0, 0]
                }
            }).getBranchThreadIds(1).should.deep.equal([0, 1]);
            (new StatInfo().getBranchThreadIds(1) === undefined).should.equal(true);
        });
    });

    describe('getBranchThreadCallCount()', function () {
        it('should return given branch thread call counts', function () {
            new StatInfo({
                branches: {
                    1: [5]
                }
            }).getBranchThreadCallCount(1, 0).should.equal(5);
            new StatInfo({
                branches: {
                    1: [0, 7]
                }
            }).getBranchThreadCallCount(1, 1).should.equal(7);
            (new StatInfo({
                branches: {
                    1: [0]
                }
            }).getBranchThreadCallCount(1, 3) === undefined).should.equal(true);
        });
    });

    describe('calcSummary()', function () {
        it('should calc line summary', function () {
            var summary = new StatInfo({
                lines: {
                    1: 0,
                    2: 1
                }
            }).calcSummary();
            summary.getLineCount().should.equal(2);
            summary.getCoveredLineCount().should.equal(1);
        });

        it('should calc function summary', function () {
            var summary = new StatInfo({
                functions: {
                    1: 0,
                    2: 1
                }
            }).calcSummary();
            summary.getFunctionCount().should.equal(2);
            summary.getCoveredFunctionCount().should.equal(1);
        });

        it('should calc branch summary', function () {
            var summary = new StatInfo({
                branches: {
                    1: [0, 0],
                    2: [1, 0],
                    3: [1, 1]
                }
            }).calcSummary();
            summary.getBranchCount().should.equal(3);
            summary.getCoveredBranchCount().should.equal(1);
        });
    });

    describe('fromJSON()', function () {
        it('should parse lines', function () {
            var statInfo = StatInfo.fromJSON({lines: {1: 0, 2: 1, 3: 5}});
            statInfo.getLineNumbers().should.deep.equal([1, 2, 3]);
            statInfo.getLineCallCount(1).should.equal(0);
            statInfo.getLineCallCount(2).should.equal(1);
            statInfo.getLineCallCount(3).should.equal(5);
        });

        it('should parse functions', function () {
            var statInfo = StatInfo.fromJSON({functions: {1: 0, 2: 1, 3: 5}});
            statInfo.getFunctionIds().should.deep.equal([1, 2, 3]);
            statInfo.getFunctionCallCount(1).should.equal(0);
            statInfo.getFunctionCallCount(2).should.equal(1);
            statInfo.getFunctionCallCount(3).should.equal(5);
        });

        it('should parse branches', function () {
            var statInfo = StatInfo.fromJSON({branches: {1: [0], 2: [1], 3: [5, 6]}});
            statInfo.getBranchIds().should.deep.equal([1, 2, 3]);
            statInfo.getBranchThreadCallCount(1, 0).should.equal(0);
            statInfo.getBranchThreadCallCount(2, 0).should.equal(1);
            statInfo.getBranchThreadCallCount(3, 0).should.equal(5);
            statInfo.getBranchThreadCallCount(3, 1).should.equal(6);
        });
    });

    describe('toJSON()', function () {
        it('should build correct json', function () {
            statInfo.registerLineNumber(1);
            statInfo.registerLineNumber(2);
            statInfo.registerFunctionId(5);
            statInfo.registerFunctionId(6);
            statInfo.registerBranchId(7, 2);
            statInfo.registerBranchId(8, 3);
            statInfo.toJSON().should.deep.equal({
                lines: {1: 0, 2: 0},
                functions: {5: 0, 6: 0},
                branches: {7: [0, 0], 8: [0, 0, 0]}
            });
        });
    });
});
