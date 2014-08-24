var FileSet = require('../../../lib/file-sets/simple-file-set');

describe('SimpleFileSet', function () {
    describe('getTestName()', function () {
        it('should always return "default"', function () {
            (new FileSet()).getTestName().should.equal('default');
        });
    });
});
