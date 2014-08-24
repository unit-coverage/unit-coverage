var Instrumenter = require('../../lib/instrumenter');
var BasenameFileSet = require('../../lib/file-sets/basename-file-set');
var utils = require('./../_utils');
var vm = require('vm');

var CoverageInfo = require('../../lib/obj/coverage-info');

describe('Instrumenter', function () {
    describe('branches', function () {
        var instrumenter;

        beforeEach(function () {
            instrumenter = new Instrumenter(new BasenameFileSet(), __dirname, {apiObjectName: '___sepCoverage___'});
        });

        afterEach(function () {
            utils.cleanupGlobal();
        });

        function run(code) {
            vm.runInThisContext(instrumenter.instrument(code.join('\n'), __dirname + '/code.js'));
            var coverageInfo = CoverageInfo.fromJSON(utils.getMap());
            return coverageInfo.getFileInfo('code.js');
        }

        it('should instrument logical expressions', function () {
            var res = run([
                'var x = true && 5;',
                'x = false && 5;'
            ]);

            res.getStatInfo().getBranchIds().should.deep.equal([1, 2]);
            res.getStatInfo().getBranchThreadCallCount(1, 0).should.equal(1);
            res.getStatInfo().getBranchThreadCallCount(2, 0).should.equal(0);

            res.getBranchInfo(1).getType().should.equal('LogicalExpression');
            res.getBranchInfo(2).getType().should.equal('LogicalExpression');
        });

        it('should instrument conditional expressions', function () {
            var res = run([
                'var x = true ? 5 : 6;',
                'x = false ? 5 : 6;'
            ]);

            res.getStatInfo().getBranchIds().should.deep.equal([1, 2]);
            res.getStatInfo().getBranchThreadCallCount(1, 0).should.equal(1);
            res.getStatInfo().getBranchThreadCallCount(1, 1).should.equal(0);
            res.getStatInfo().getBranchThreadCallCount(2, 0).should.equal(0);
            res.getStatInfo().getBranchThreadCallCount(2, 1).should.equal(1);

            res.getBranchInfo(1).getType().should.equal('ConditionalExpression');
            res.getBranchInfo(2).getType().should.equal('ConditionalExpression');
        });

        it('should instrument if statements', function () {
            var res = run([
                'if (true) { void 0; } else void 0;',
                'if (false) void 0;',
                'if (true);',
                'if (true); else;'
            ]);

            res.getStatInfo().getBranchIds().should.deep.equal([1, 2, 3, 4]);
            res.getStatInfo().getBranchThreadCallCount(1, 0).should.equal(1);
            res.getStatInfo().getBranchThreadCallCount(1, 1).should.equal(0);
            res.getStatInfo().getBranchThreadCallCount(2, 0).should.equal(0);
            res.getStatInfo().getBranchThreadCallCount(2, 1).should.equal(1);
            res.getStatInfo().getBranchThreadCallCount(3, 0).should.equal(1);
            res.getStatInfo().getBranchThreadCallCount(3, 1).should.equal(0);
            res.getStatInfo().getBranchThreadCallCount(4, 0).should.equal(1);
            res.getStatInfo().getBranchThreadCallCount(4, 1).should.equal(0);

            res.getBranchInfo(1).getType().should.equal('IfStatement');
            res.getBranchInfo(2).getType().should.equal('IfStatement');
            res.getBranchInfo(3).getType().should.equal('IfStatement');
            res.getBranchInfo(4).getType().should.equal('IfStatement');
        });
    });
});
