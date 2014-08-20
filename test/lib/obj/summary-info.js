var SummaryInfo = require('../../../lib/obj/summary-info');

describe('SummaryInfo', function () {
    describe('getLineCount()', function () {
        it('should return given line count', function () {
            new SummaryInfo({lineCount: 10}).getLineCount().should.equal(10);
        });
    });

    describe('getCoveredLineCount()', function () {
        it('should return given covered line count', function () {
            new SummaryInfo({coveredLineCount: 10}).getCoveredLineCount().should.equal(10);
        });
    });

    describe('getFunctionCount()', function () {
        it('should return given function count', function () {
            new SummaryInfo({functionCount: 10}).getFunctionCount().should.equal(10);
        });
    });

    describe('getCoveredFunctionCount()', function () {
        it('should return given covered function count', function () {
            new SummaryInfo({coveredFunctionCount: 10}).getCoveredFunctionCount().should.equal(10);
        });
    });

    describe('getBranchCount()', function () {
        it('should return given branch count', function () {
            new SummaryInfo({branchCount: 10}).getBranchCount().should.equal(10);
        });
    });

    describe('getCoveredBranchCount()', function () {
        it('should return given covered branch count', function () {
            new SummaryInfo({coveredBranchCount: 10}).getCoveredBranchCount().should.equal(10);
        });
    });

    describe('calcLineCoverage()', function () {
        it('should return correct line coverage', function () {
            new SummaryInfo({lineCount: 10, coveredLineCount: 5}).calcLineCoverage().should.equal(0.5);
        });
        it('should return 1 if no lines defined', function () {
            new SummaryInfo().calcLineCoverage().should.equal(1);
        });
    });

    describe('calcFunctionCoverage()', function () {
        it('should return correct function coverage', function () {
            new SummaryInfo({functionCount: 10, coveredFunctionCount: 5}).calcFunctionCoverage().should.equal(0.5);
        });
        it('should return 1 if no functions defined', function () {
            new SummaryInfo().calcFunctionCoverage().should.equal(1);
        });
    });

    describe('calcBranchCoverage()', function () {
        it('should return correct branch coverage', function () {
            new SummaryInfo({branchCount: 10, coveredBranchCount: 5}).calcBranchCoverage().should.equal(0.5);
        });
        it('should return 1 if no branches defined', function () {
            new SummaryInfo().calcBranchCoverage().should.equal(1);
        });
    });

    describe('calcTotalCoverage()', function () {
        it('should return correct line coverage', function () {
            new SummaryInfo({lineCount: 10, coveredLineCount: 5}).calcTotalCoverage().should.equal(0.5);
        });
        it('should return correct function coverage', function () {
            new SummaryInfo({functionCount: 10, coveredFunctionCount: 5}).calcTotalCoverage().should.equal(0.5);
        });
        it('should return correct branch coverage', function () {
            new SummaryInfo({branchCount: 10, coveredBranchCount: 5}).calcTotalCoverage().should.equal(0.5);
        });
        it('should return correct total coverage', function () {
            new SummaryInfo({
                lineCount: 4, coveredLineCount: 2,
                functionCount: 4, coveredFunctionCount: 1,
                branchCount: 2, coveredBranchCount: 2
            }).calcTotalCoverage().should.equal(0.5);
        });
        it('should return 1 if nothing defined', function () {
            new SummaryInfo().calcTotalCoverage().should.equal(1);
        });
    });

    describe('add()', function () {
        it('should add line coverage info', function () {
            var summary = new SummaryInfo();
            summary.add(new SummaryInfo({lineCount: 4, coveredLineCount: 2}));
            summary.getLineCount().should.equal(4);
            summary.getCoveredLineCount().should.equal(2);
        });
        it('should add function coverage info', function () {
            var summary = new SummaryInfo();
            summary.add(new SummaryInfo({functionCount: 10, coveredFunctionCount: 5}));
            summary.getFunctionCount().should.equal(10);
            summary.getCoveredFunctionCount().should.equal(5);
        });
        it('should add branch coverage info', function () {
            var summary = new SummaryInfo();
            summary.add(new SummaryInfo({branchCount: 3, coveredBranchCount: 2}));
            summary.getBranchCount().should.equal(3);
            summary.getCoveredBranchCount().should.equal(2);
        });
    });

    describe('fromJSON()', function () {
        it('should parse summary info', function () {
            var summaryInfo = SummaryInfo.fromJSON({
                lineCount: 10,
                coveredLineCount: 5,
                functionCount: 5,
                coveredFunctionCount: 3,
                branchCount: 7,
                coveredBranchCount: 4
            });

            summaryInfo.getLineCount().should.equal(10);
            summaryInfo.getCoveredLineCount().should.equal(5);
            summaryInfo.getFunctionCount().should.equal(5);
            summaryInfo.getCoveredFunctionCount().should.equal(3);
            summaryInfo.getBranchCount().should.equal(7);
            summaryInfo.getCoveredBranchCount().should.equal(4);
        });
    });

    describe('toJSON()', function () {
        it('should generate summary info', function () {
            var json = {
                lineCount: 10,
                coveredLineCount: 5,
                functionCount: 5,
                coveredFunctionCount: 3,
                branchCount: 7,
                coveredBranchCount: 4
            };
            new SummaryInfo(json).toJSON().should.deep.equal(json);
        });
    });
});
