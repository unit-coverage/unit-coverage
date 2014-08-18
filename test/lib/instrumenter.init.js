var Instrumenter = require('../../lib/instrumenter');
var BasenameFileSet = require('../../lib/basename-file-set');
var utils = require('./../_utils');
var vm = require('vm');

var CoverageInfo = require('../../lib/obj/coverage-info');

describe('Instrumenter', function () {
    describe('init', function () {
        var instrumenter;

        beforeEach(function () {
            instrumenter = new Instrumenter(new BasenameFileSet(), __dirname, {
                varPrefix: '___', varPostfix: '___'
            });
            instrumenter.setApiObjectName('coverageApi');
        });

        afterEach(function () {
            utils.cleanupGlobal();
            delete global.coverageApi;
        });

        function run(code, filename) {
            vm.runInThisContext(instrumenter.instrument(code.join('\n'), __dirname + '/' + filename));
        }

        it('should move line info to initStat', function () {
            run([
                'x = 1;',
                'x++;'
            ], 'code.1.js');

            global.coverageApi.initialize();

            run([
                'y = 1;',
                'y++;'
            ], 'code.2.js');

            var coverageInfo = CoverageInfo.fromJSON(global.coverageApi.getCoverageData());

            var firstFile = coverageInfo.getFileInfo('code.1.js');
            firstFile.getInitStatInfo().getLineNumbers().should.deep.equal([1, 2]);
            firstFile.getInitStatInfo().getLineCallCount(1).should.equal(1);
            firstFile.getInitStatInfo().getLineCallCount(2).should.equal(1);

            var secondFile = coverageInfo.getFileInfo('code.2.js');
            secondFile.getStatInfo().getLineNumbers().should.deep.equal([1, 2]);
            secondFile.getStatInfo().getLineCallCount(1).should.equal(1);
            secondFile.getStatInfo().getLineCallCount(2).should.equal(1);
        });

        it('should move function info to initStat', function () {
            run([
                'function x(){}',
                'x();'
            ], 'code.1.js');

            global.coverageApi.initialize();

            run([
                'function y(){}',
                'y();'
            ], 'code.2.js');

            var coverageInfo = CoverageInfo.fromJSON(global.coverageApi.getCoverageData());

            var firstFile = coverageInfo.getFileInfo('code.1.js');
            firstFile.getInitStatInfo().getFunctionIds().should.deep.equal([1]);
            firstFile.getInitStatInfo().getFunctionCallCount(1).should.equal(1);

            var secondFile = coverageInfo.getFileInfo('code.2.js');
            secondFile.getStatInfo().getFunctionIds().should.deep.equal([2]);
            secondFile.getStatInfo().getFunctionCallCount(2).should.equal(1);
        });
    });
});
