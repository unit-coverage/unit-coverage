var Instrumenter = require('../../lib/instrumenter');
var BasenameFileSet = require('../../lib/file-sets/basename-file-set');
var utils = require('./../_utils');
var vm = require('vm');

var CoverageInfo = require('../../lib/obj/coverage-info');

describe('Instrumenter', function () {
    describe('lines', function () {
        var instrumenter;

        beforeEach(function () {
            instrumenter = new Instrumenter(new BasenameFileSet(), __dirname, {apiObjectName: '___unitCoverage___'});
        });

        afterEach(function () {
            utils.cleanupGlobal();
        });

        function run(code) {
            vm.runInThisContext(instrumenter.instrument(code.join('\n'), __dirname + '/code.js'));
            var coverageInfo = CoverageInfo.fromJSON(utils.getMap());
            return coverageInfo.getFileInfo('code.js');
        }

        it('should instrument lines at file root namespace', function () {
            var res = run([
                'var i = 0, x = 0;',
                '',
                'i += 3;',
                '',
                'while (i--)',
                    'x += i;'
            ]);

            res.getStatInfo().getLineNumbers().should.deep.equal([1, 3, 5, 6]);
            res.getStatInfo().getLineCallCount(1).should.equal(1);
            res.getStatInfo().getLineCallCount(3).should.equal(1);
            res.getStatInfo().getLineCallCount(5).should.equal(1);
            res.getStatInfo().getLineCallCount(6).should.equal(3);
        });

        it('should instrument lines at function scope', function () {
            var res = run([
                'var f = function(x) {',
                    'x++;',
                    'return x;',
                '};',
                '',
                'f(0);'
            ]);

            res.getStatInfo().getLineNumbers().should.deep.equal([1, 2, 3, 6]);
            res.getStatInfo().getLineCallCount(1).should.equal(1);
            res.getStatInfo().getLineCallCount(2).should.equal(1);
            res.getStatInfo().getLineCallCount(3).should.equal(1);
            res.getStatInfo().getLineCallCount(6).should.equal(1);
        });

        it('should instrument lines at switch scope', function () {
            var res = run([
                'function f(x) {',
                    'switch (x) {',
                        'case 0:',
                            'break;',
                        'case 1:',
                            'break;',
                    '}',
                '}',
                'f(0);'
            ]);

            res.getStatInfo().getLineNumbers().should.deep.equal([1, 2, 4, 6, 9]);
            res.getStatInfo().getLineCallCount(1).should.equal(1);
            res.getStatInfo().getLineCallCount(2).should.equal(1);
            res.getStatInfo().getLineCallCount(4).should.equal(1);
            res.getStatInfo().getLineCallCount(6).should.equal(0);
            res.getStatInfo().getLineCallCount(9).should.equal(1);
        });
    });
});
