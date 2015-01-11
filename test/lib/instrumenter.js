var sinon = require('sinon');
var Source = require('../../lib/source');
var Instrumenter = require('../../lib/instrumenter');
var BasenameFileSet = require('../../lib/file-sets/basename-file-set');
var MochaTestDriver = require('../../lib/test-drivers/mocha-test-driver');
var MochaPhantomTestDriver = require('../../lib/test-drivers/mocha-phantom-test-driver');

describe('Instrumenter', function () {
    describe('constructor()', function () {
        it('should accept empty options', function () {
            var instrumenter = new Instrumenter(new BasenameFileSet(), process.cwd());
            instrumenter.getApiObjectName().should.equal('__unitCoverage__');
        });

        it('should accept empty sourceRoot', function () {
            var instrumenter = new Instrumenter(new BasenameFileSet());
            instrumenter.getSourceRoot().should.equal(process.cwd());
        });

        it('should accept sourceRoot', function () {
            var instrumenter = new Instrumenter(new BasenameFileSet(), '/');
            instrumenter.getSourceRoot().should.equal('/');
        });

        it('should accept excludes', function () {
            var instrumenter = new Instrumenter(new BasenameFileSet(), process.cwd(), {
                excludes: ['1.js']
            });
            instrumenter.getExcludes().should.deep.equal(['1.js']);
        });

        it('should create MochaTestDriver by default', function () {
            var instrumenter = new Instrumenter(new BasenameFileSet());
            instrumenter.getTestDriver().should.be.instanceof(MochaTestDriver);
        });

        it('should accept testDriver', function () {
            var instrumenter = new Instrumenter(new BasenameFileSet(), process.cwd(), {
                testDriver: new MochaPhantomTestDriver()
            });
            instrumenter.getTestDriver().should.be.instanceof(MochaPhantomTestDriver);
        });

        it('should exclude init coverage by default', function () {
            var instrumenter = new Instrumenter(new BasenameFileSet());
            instrumenter.isInitCoverageExcluded().should.equal(true);
        });

        it('should accept excludeInitCoverage', function () {
            var instrumenter = new Instrumenter(new BasenameFileSet(), '/', {excludeInitCoverage: false});
            instrumenter.isInitCoverageExcluded().should.equal(false);
        });
    });

    describe('addExclude()', function () {
        it('should add exclude', function () {
            var instrumenter = new Instrumenter(new BasenameFileSet(), process.cwd(), {
                excludes: ['1.js']
            });
            instrumenter.addExclude('2.js');
            instrumenter.getExcludes().should.deep.equal(['1.js', '2.js']);
        });
    });

    describe('generateCoverageInfo()', function () {
        it('should build lines, functions and branches', function () {
            var instrumenter = new Instrumenter(new BasenameFileSet());
            var res = instrumenter.generateCoverageInfo([
                'var f = function f(x) {',
                'x = x || 0;',
                'return x;',
                '};',
                '',
                'f(0);'
            ].join('\n'), '1.js');

            res.getFileInfos()[0].getStatInfo().getLineNumbers().should.deep.equal([1, 2, 3, 6]);
            res.getFileInfos()[0].getFunctionIds().should.deep.equal([1]);
            res.getFileInfos()[0].getFunctionInfo(1).getName().should.equal('f');
            res.getFileInfos()[0].getBranchIds().should.deep.equal([1]);
            res.getFileInfos()[0].getBranchInfo(1).getType().should.equal('LogicalExpression');
            res.getFileInfos()[0].getBranchInfo(1).getThreads().length.should.equal(2);
        });
    });

    describe('instrumentTests()', function () {
        it('should use test driver', function () {
            var testDriver = {
                configure: sinon.spy(),
                process: sinon.spy()
            };
            var instrumenter = new Instrumenter(new BasenameFileSet(), {}, {
                testDriver: testDriver,
                apiObjectName: 'api'
            });
            instrumenter.instrumentTests('x++', '1.js');

            testDriver.configure.callCount.should.equal(1);
            testDriver.configure.getCall(0).args[0].apiObjectName.should.equal('api');
            testDriver.configure.getCall(0).args.length.should.equal(1);

            testDriver.process.callCount.should.equal(1);
            testDriver.process.getCall(0).args[0].should.be.instanceof(Source);
            testDriver.process.getCall(0).args.length.should.equal(1);
        });
    });
});
