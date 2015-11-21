var Instrumenter = require('../../lib/instrumenter');
var BasenameFileSet = require('../../lib/file-sets/basename-file-set');
var utils = require('./../_utils');
var vm = require('vm');
var babelCode = require('babel-core');

var CoverageInfo = require('../../lib/obj/coverage-info');

describe('Instrumenter', function () {
    this.timeout(20000);
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

        it('should instrument classes', function () {
            var res = run([
                'class Hello {',
                '    constructor() {}',
                '    method1() {}',
                '    method2() {}',
                '    get prop1() {}',
                '    get prop2() {}',
                '    set prop1(value) {}',
                '    set prop2(value) {}',
                '}',
                'var hello = new Hello();',
                'hello.method1();',
                'var val = hello.prop1;',
                'hello.prop1 = 123;'
            ]);

            res.getStatInfo().getFunctionIds().should.deep.equal([1, 2, 3, 4, 5, 6, 7]);
            res.getStatInfo().getFunctionCallCount(1).should.equal(1);
            res.getStatInfo().getFunctionCallCount(2).should.equal(1);
            res.getStatInfo().getFunctionCallCount(3).should.equal(0);
            res.getStatInfo().getFunctionCallCount(4).should.equal(1);
            res.getStatInfo().getFunctionCallCount(5).should.equal(0);
            res.getStatInfo().getFunctionCallCount(6).should.equal(1);
            res.getStatInfo().getFunctionCallCount(7).should.equal(0);

            res.getFunctionInfo(1).getName().should.equal('Hello::constructor');
            res.getFunctionInfo(1).getLocation().start.line.should.equal(2);
            res.getFunctionInfo(2).getName().should.equal('Hello::method1');
            res.getFunctionInfo(2).getLocation().start.line.should.equal(3);
            res.getFunctionInfo(3).getName().should.equal('Hello::method2');
            res.getFunctionInfo(3).getLocation().start.line.should.equal(4);
            res.getFunctionInfo(4).getName().should.equal('Hello::prop1(get)');
            res.getFunctionInfo(4).getLocation().start.line.should.equal(5);
            res.getFunctionInfo(5).getName().should.equal('Hello::prop2(get)');
            res.getFunctionInfo(5).getLocation().start.line.should.equal(6);
            res.getFunctionInfo(6).getName().should.equal('Hello::prop1(set)');
            res.getFunctionInfo(6).getLocation().start.line.should.equal(7);
            res.getFunctionInfo(7).getName().should.equal('Hello::prop2(set)');
            res.getFunctionInfo(7).getLocation().start.line.should.equal(8);
        });
    });
});
