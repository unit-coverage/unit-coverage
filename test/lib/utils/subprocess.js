var run = require('../../../lib/utils/subprocess').run;
var sinon = require('sinon');

describe('subprocess', function () {
    describe('run()', function () {
        function mockStd() {
            sinon.stub(process.stdout, 'write');
            sinon.stub(process.stderr, 'write');
        }

        function releaseStd() {
            process.stdout.write.restore();
            process.stderr.write.restore();
        }

        it('should execute subprocess', function () {
            mockStd();
            return run(process.execPath, ['-e', 'console.error("test");']).then(function() {
                var errors = process.stderr.write.getCall(0).args[0].toString();
                releaseStd();
                errors.should.equal('test\n');
            });
        });

        it('should apply quiet option', function () {
            mockStd();
            return run(process.execPath, ['-e', 'console.error("test");'], {}, true).then(function() {
                var callCount = process.stderr.write.callCount;
                releaseStd();
                callCount.should.equal(0);
            });
        });

        it('should execute subprocess', function () {
            mockStd();
            return run(process.execPath, ['-e', 'console.error(1);process.exit(1);']).fail(function(e) {
                e.message.should.equal(
                    'Command failed: ' + process.execPath + ' -e console.error(1);process.exit(1);\n1\n'
                );
                releaseStd();
            });
        });
    });
});
