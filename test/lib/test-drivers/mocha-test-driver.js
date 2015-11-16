var path = require('path');
var sinon = require('sinon');
var javascript = require('../../../lib/javascript');
var subprocess = require('../../../lib/utils/subprocess');
var SimpleFileSet = require('../../../lib/file-sets/simple-file-set');
var Source = require('../../../lib/source');
var MochaTestDriver = require('../../../lib/test-drivers/mocha-test-driver');

describe('MochaPhantomTestDriver', function () {
    describe('process()', function () {
        it('should add beforeAll/afterAll handlers', function () {
            var source = new Source(process.cwd(), process.cwd() + '/tmp/file.js', 'x++;', [], new SimpleFileSet());
            var testDriver = new MochaTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.process(source);
            var code = javascript.generate(source.getAst());
            code.should.equal([
                'x++;',
                'if (typeof mocha !== "undefined") {',
                '    mocha.suite.beforeAll(api.initialize);mocha.suite.afterAll(api.save);',
                '} else {',
                '    before(api.initialize);after(api.save);',
                '}'
            ].join('\n'));
        });

        it('should add before/after handlers', function () {
            var source = new Source(
                process.cwd(),
                process.cwd() + '/tmp/file.js',
                'describe("test", function() {});',
                [],
                new SimpleFileSet()
            );
            var testDriver = new MochaTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.process(source);
            var code = javascript.generate(source.getAst());
            code.should.equal([
                'describe("test", function () {',
                '    before(function () {',
                '        api.beginTest("default");',
                '    });',
                '    after(function () {',
                '        api.endTest();',
                '    });',
                '});',
                'if (typeof mocha !== "undefined") {',
                '    mocha.suite.beforeAll(api.initialize);mocha.suite.afterAll(api.save);',
                '} else {',
                '    before(api.initialize);after(api.save);',
                '}'
            ].join('\n'));
        });

        it('should add before/after handlers once', function () {
            var source = new Source(
                process.cwd(),
                process.cwd() + '/tmp/file.js',
                'describe("test", function() {});describe("test", function() {});',
                [],
                new SimpleFileSet()
            );
            var testDriver = new MochaTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.process(source);
            var code = javascript.generate(source.getAst());
            code.should.equal([
                'describe("test", function () {',
                '    before(function () {',
                '        api.beginTest("default");',
                '    });',
                '    after(function () {',
                '        api.endTest();',
                '    });',
                '});describe("test", function () {});',
                'if (typeof mocha !== "undefined") {',
                '    mocha.suite.beforeAll(api.initialize);mocha.suite.afterAll(api.save);',
                '} else {',
                '    before(api.initialize);after(api.save);',
                '}'
            ].join('\n'));
        });

        it('should add ignore other handlers', function () {
            var source = new Source(
                process.cwd(),
                process.cwd() + '/tmp/file.js',
                'describe1("test", function() {});',
                [],
                new SimpleFileSet()
            );
            var testDriver = new MochaTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.process(source);
            var code = javascript.generate(source.getAst());
            code.should.equal([
                'describe1("test", function () {});',
                'if (typeof mocha !== "undefined") {',
                '    mocha.suite.beforeAll(api.initialize);mocha.suite.afterAll(api.save);',
                '} else {',
                '    before(api.initialize);after(api.save);',
                '}'
            ].join('\n'));
        });

        it('should add ignore methods', function () {
            var source = new Source(
                process.cwd(),
                process.cwd() + '/tmp/file.js',
                'x.describe("test", function() {});',
                [],
                new SimpleFileSet()
            );
            var testDriver = new MochaTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.process(source);
            var code = javascript.generate(source.getAst());
            code.should.equal([
                'x.describe("test", function () {});',
                'if (typeof mocha !== "undefined") {',
                '    mocha.suite.beforeAll(api.initialize);mocha.suite.afterAll(api.save);',
                '} else {',
                '    before(api.initialize);after(api.save);',
                '}'
            ].join('\n'));
        });
    });

    describe('run()', function () {
        beforeEach(function () {
            sinon.stub(subprocess, 'run');
        });

        afterEach(function () {
            subprocess.run.restore();
        });

        it('should exec default mocha binary', function () {
            var testDriver = new MochaTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.run({runnerArgs: ['test'], outputFilename: 'out', quiet: true});
            var args = subprocess.run.getCall(0).args;
            args[0].should.equal('node_modules/.bin/mocha');
            args[1].should.deep.equal([
                '--compilers',
                'js:' + path.resolve(__dirname, '../../../lib/require-replacement.js'),
                'test'
            ]);
            args[2].should.deep.equal({
                outputFilename: 'out',
                bin: 'node_modules/.bin/mocha',
                testDriver: 'mocha',
                runnerArgs: ['test'],
                quiet: true
            });
            args[3].should.equal(true);
        });

        it('should accept custom mocha binary', function () {
            var testDriver = new MochaTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.run({bin: 'mocha', runnerArgs: ['test'], outputFilename: 'out', quiet: true});
            var args = subprocess.run.getCall(0).args;
            args[0].should.equal('mocha');
            args[1].should.deep.equal([
                '--compilers',
                'js:' + path.resolve(__dirname, '../../../lib/require-replacement.js'),
                'test'
            ]);
            args[2].should.deep.equal({
                outputFilename: 'out',
                bin: 'mocha',
                testDriver: 'mocha',
                runnerArgs: ['test'],
                quiet: true
            });
            args[3].should.equal(true);
        });
    });
});
