var path = require('path');
var sinon = require('sinon');
var escodegen = require('escodegen');
var subprocess = require('../../../lib/utils/subprocess');
var SimpleFileSet = require('../../../lib/file-sets/simple-file-set');
var Source = require('../../../lib/source');
var MochaPhantomTestDriver = require('../../../lib/test-drivers/mocha-phantom-test-driver');

describe('MochaPhantomTestDriver', function () {
    describe('process()', function () {
        it('should add beforeAll/afterAll handlers', function () {
            var source = new Source(process.cwd(), process.cwd() + '/tmp/file.js', 'x++;', [], new SimpleFileSet());
            var testDriver = new MochaPhantomTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.process(source);
            var code = escodegen.generate(source.getAst());
            code.should.equal([
                'x++;',
                'if (typeof mocha !== \'undefined\') {',
                '    mocha.suite.beforeAll(api.initialize);',
                '    mocha.suite.afterAll(api.save);',
                '} else {',
                '    before(api.initialize);',
                '    after(api.save);',
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
            var testDriver = new MochaPhantomTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.process(source);
            var code = escodegen.generate(source.getAst());
            code.should.equal([
                'describe(\'test\', function () {',
                '    before(function () {',
                '        api.beginTest(\'default\');',
                '    });',
                '    after(function () {',
                '        api.endTest();',
                '    });',
                '});',
                'if (typeof mocha !== \'undefined\') {',
                '    mocha.suite.beforeAll(api.initialize);',
                '    mocha.suite.afterAll(api.save);',
                '} else {',
                '    before(api.initialize);',
                '    after(api.save);',
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
            var testDriver = new MochaPhantomTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.process(source);
            var code = escodegen.generate(source.getAst());
            code.should.equal([
                'describe(\'test\', function () {',
                '    before(function () {',
                '        api.beginTest(\'default\');',
                '    });',
                '    after(function () {',
                '        api.endTest();',
                '    });',
                '});',
                'describe(\'test\', function () {',
                '});',
                'if (typeof mocha !== \'undefined\') {',
                '    mocha.suite.beforeAll(api.initialize);',
                '    mocha.suite.afterAll(api.save);',
                '} else {',
                '    before(api.initialize);',
                '    after(api.save);',
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
            var testDriver = new MochaPhantomTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.process(source);
            var code = escodegen.generate(source.getAst());
            code.should.equal([
                'describe1(\'test\', function () {',
                '});',
                'if (typeof mocha !== \'undefined\') {',
                '    mocha.suite.beforeAll(api.initialize);',
                '    mocha.suite.afterAll(api.save);',
                '} else {',
                '    before(api.initialize);',
                '    after(api.save);',
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
            var testDriver = new MochaPhantomTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.process(source);
            var code = escodegen.generate(source.getAst());
            code.should.equal([
                'x.describe(\'test\', function () {',
                '});',
                'if (typeof mocha !== \'undefined\') {',
                '    mocha.suite.beforeAll(api.initialize);',
                '    mocha.suite.afterAll(api.save);',
                '} else {',
                '    before(api.initialize);',
                '    after(api.save);',
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

        it('should exec default mocha-phantomjs binary', function () {
            var testDriver = new MochaPhantomTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.run({runnerArgs: ['test'], outputFilename: 'out', quiet: true});
            var args = subprocess.run.getCall(0).args;
            args[0].should.equal('node_modules/.bin/mocha-phantomjs');
            args[1].should.deep.equal([
                '-k',
                path.resolve(__dirname, '../../../hooks/phantom-dump-coverage.js'),
                '-s',
                'outputFilename=out',
                'test'
            ]);
            args[2].should.deep.equal({});
            args[3].should.equal(true);
        });

        it('should accept custom mocha-phantomjs binary', function () {
            var testDriver = new MochaPhantomTestDriver();
            testDriver.configure({apiObjectName: 'api'});
            testDriver.run({bin: 'mocha-phantomjs', runnerArgs: ['test'], outputFilename: 'out', quiet: true});
            var args = subprocess.run.getCall(0).args;
            args[0].should.equal('mocha-phantomjs');
            args[1].should.deep.equal([
                '-k',
                path.resolve(__dirname, '../../../hooks/phantom-dump-coverage.js'),
                '-s',
                'outputFilename=out',
                'test'
            ]);
            args[2].should.deep.equal({});
            args[3].should.equal(true);
        });
    });
});
