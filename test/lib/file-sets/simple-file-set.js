var SimpleFileSet = require('../../../lib/file-sets/simple-file-set');

describe('SimpleFileSet', function () {
    describe('configure()', function () {
        it('should not thow any error', function () {
            new SimpleFileSet().configure({});
        });
    });

    describe('getTestName()', function () {
        it('should always return "default"', function () {
            new SimpleFileSet().getTestName().should.equal('default');
        });
    });
});
