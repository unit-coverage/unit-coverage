var Instrumenter = require('../../lib/instrumenter');
var BasenameFileSet = require('../../lib/file-sets/basename-file-set');
var utils = require('./../_utils');
var fs = require('fs');
var vm = require('vm');

var CoverageInfo = require('../../lib/obj/coverage-info');

describe('Instrumenter', function () {
    describe('save', function () {
        var instrumenter;
        var coverageFilePath = __dirname + '/coverage.json';

        beforeEach(function () {
            instrumenter = new Instrumenter(new BasenameFileSet(), __dirname, {
                apiObjectName: 'coverageApi',
                export: true, exportFilename: coverageFilePath
            });
            global.require = require;
        });

        afterEach(function () {
            utils.cleanupGlobal();
            delete global.require;
            delete global.coverageApi;
            fs.unlinkSync(coverageFilePath);
        });

        function run(code) {
            vm.runInThisContext(instrumenter.instrument(code.join('\n'), __dirname + '/code.js'));
            global.coverageApi.save();
            var coverageInfo = CoverageInfo.fromJSON(JSON.parse(fs.readFileSync(coverageFilePath, 'utf8')));
            return coverageInfo.getFileInfo('code.js');
        }

        it('should save line coverage data', function () {
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

        it('should save function coverage data', function () {
            var res = run([
                'function x() {',
                    'return 1;',
                '}',
                'function y() {}',
                'function z() {}',
                'x();'
            ]);

            res.getStatInfo().getFunctionIds().should.deep.equal([1, 2, 3]);
            res.getStatInfo().getFunctionCallCount(1).should.equal(1);
            res.getStatInfo().getFunctionCallCount(2).should.equal(0);
            res.getStatInfo().getFunctionCallCount(3).should.equal(0);

            res.getFunctionInfo(1).getName().should.equal('x');
            res.getFunctionInfo(1).getLocation().start.line.should.equal(1);
            res.getFunctionInfo(2).getName().should.equal('y');
            res.getFunctionInfo(2).getLocation().start.line.should.equal(4);
            res.getFunctionInfo(3).getName().should.equal('z');
            res.getFunctionInfo(3).getLocation().start.line.should.equal(5);
        });
    });
});
