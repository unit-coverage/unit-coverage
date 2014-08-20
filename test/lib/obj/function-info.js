var FunctionInfo = require('../../../lib/obj/function-info');

describe('FunctionInfo', function () {
    var location = {
        start: {line: 1, column: 0},
        end: {line: 3, column: 5}
    };
    var functionInfo = new FunctionInfo(1, 'fname', location);

    describe('getId()', function () {
        it('should return given id', function () {
            functionInfo.getId().should.equal(1);
        });
    });

    describe('getName()', function () {
        it('should return given name', function () {
            functionInfo.getName().should.equal('fname');
        });
    });

    describe('getLocation()', function () {
        it('should return given location', function () {
            functionInfo.getLocation().should.deep.equal(location);
        });
    });

    describe('fromJSON()', function () {
        it('should parse json', function () {
            var fi = FunctionInfo.fromJSON({
                id: 1,
                name: 'fname',
                location: location
            });
            fi.getId().should.equal(1);
            fi.getName().should.equal('fname');
            fi.getLocation().should.deep.equal(location);
        });
    });

    describe('toJSON()', function () {
        it('should return correct FunctionInfo', function () {
            functionInfo.toJSON().should.deep.equal({
                id: 1,
                name: 'fname',
                location: location
            });
        });
    });
});
