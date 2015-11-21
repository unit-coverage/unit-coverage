var Instrumenter = require('../../lib/instrumenter');
var BasenameFileSet = require('../../lib/file-sets/basename-file-set');
var utils = require('./../_utils');
var vm = require('vm');
var babelCode = require('babel-core');

var CoverageInfo = require('../../lib/obj/coverage-info');

describe('Instrumenter', function () {
    this.timeout(5000);
    describe('functions', function () {
        var instrumenter;

        beforeEach(function () {
            instrumenter = new Instrumenter(new BasenameFileSet(), __dirname, {apiObjectName: '___unitCoverage___'});
        });

        afterEach(function () {
            utils.cleanupGlobal();
        });

        function run(code) {
            var transformationResult = babelCode.transform(
                instrumenter.instrument(code.join('\n'), __dirname + '/code.js'),
                {
                    presets: ['es2015', 'react']
                }
            ).code;
            vm.runInThisContext(transformationResult);
            var coverageInfo = CoverageInfo.fromJSON(utils.getMap());
            return coverageInfo.getFileInfo('code.js');
        }

        it('should instrument named function declarations', function () {
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

        it('should instrument named function expressions', function () {
            var res = run([
                'var a = function x() {',
                    'return 1;',
                '}',
                'var b = function y() {}',
                'var c = function z() {}',
                'a();'
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

        it('should instrument unnamed function expressions', function () {
            var res = run([
                'var a = function() {',
                    'return 1;',
                '}',
                'var b = function() {}',
                'var c = function() {}',
                'b();'
            ]);

            res.getStatInfo().getFunctionIds().should.deep.equal([1, 2, 3]);
            res.getStatInfo().getFunctionCallCount(1).should.equal(0);
            res.getStatInfo().getFunctionCallCount(2).should.equal(1);
            res.getStatInfo().getFunctionCallCount(3).should.equal(0);

            res.getFunctionInfo(1).getName().should.equal('(anonymous_1)');
            res.getFunctionInfo(1).getLocation().start.line.should.equal(1);
            res.getFunctionInfo(2).getName().should.equal('(anonymous_2)');
            res.getFunctionInfo(2).getLocation().start.line.should.equal(4);
            res.getFunctionInfo(3).getName().should.equal('(anonymous_3)');
            res.getFunctionInfo(3).getLocation().start.line.should.equal(5);

        });

        it('should instrument nested functions', function () {
            var res = run([
                'function x() {',
                    'return (function(){})();',
                '}',
                'x();'
            ]);

            res.getStatInfo().getFunctionIds().should.deep.equal([1, 2]);
            res.getStatInfo().getFunctionCallCount(1).should.equal(1);
            res.getStatInfo().getFunctionCallCount(2).should.equal(1);

            res.getFunctionInfo(1).getName().should.equal('x');
            res.getFunctionInfo(1).getLocation().start.line.should.equal(1);
            res.getFunctionInfo(2).getName().should.equal('(anonymous_2)');
            res.getFunctionInfo(2).getLocation().start.line.should.equal(2);
        });


        it('should instrument arrow function expressions', function () {
            var res = run([
                'var a = () => {',
                'return 1;',
                '}',
                'var b = () => {}',
                'var c = () => {}',
                'b();'
            ]);

            res.getStatInfo().getFunctionIds().should.deep.equal([1, 2, 3]);
            res.getStatInfo().getFunctionCallCount(1).should.equal(0);
            res.getStatInfo().getFunctionCallCount(2).should.equal(1);
            res.getStatInfo().getFunctionCallCount(3).should.equal(0);

            res.getFunctionInfo(1).getName().should.equal('(anonymous_1)');
            res.getFunctionInfo(1).getLocation().start.line.should.equal(1);
            res.getFunctionInfo(2).getName().should.equal('(anonymous_2)');
            res.getFunctionInfo(2).getLocation().start.line.should.equal(4);
            res.getFunctionInfo(3).getName().should.equal('(anonymous_3)');
            res.getFunctionInfo(3).getLocation().start.line.should.equal(5);
        });
    });
});
