var create = require('../../../lib/test-drivers/test-drivers').create;
var MochaTestDriver = require('../../../lib/test-drivers/mocha-test-driver');
var MochaPhantomTestDriver = require('../../../lib/test-drivers/mocha-phantom-test-driver');

describe('test-drivers', function () {
    describe('create()', function () {
        it('should return mocha test driver', function () {
            create('mocha').should.be.instanceof(MochaTestDriver);
        });

        it('should return mocha test driver', function () {
            create('mocha-phantom').should.be.instanceof(MochaPhantomTestDriver);
        });
    });
});
