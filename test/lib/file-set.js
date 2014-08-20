var FileSet = require('../../lib/file-set');

describe('FileSet', function () {
    describe('getTestName()', function () {
        it('should always return "default"', function () {
            (new FileSet()).getTestName().should.equal('default');
        });
    });
});
