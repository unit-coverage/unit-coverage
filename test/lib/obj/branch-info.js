var BranchInfo = require('../../../lib/obj/branch-info');

describe('BranchInfo', function () {
    var threads = [
        {
            index: 0,
            location: {
                start: {line: 2, column: 0},
                end: {line: 2, column: 5}
            }
        },
        {
            index: 1,
            location: {
                start: {line: 3, column: 0},
                end: {line: 3, column: 5}
            }
        }
    ];
    var location = {
        start: {line: 1, column: 0},
        end: {line: 3, column: 5}
    };
    var branchInfo = new BranchInfo(1, 'if', location, threads);

    describe('getId()', function () {
        it('should return given id', function () {
            branchInfo.getId().should.equal(1);
        });
    });

    describe('getType()', function () {
        it('should return given type', function () {
            branchInfo.getType().should.equal('if');
        });
    });

    describe('getLocation()', function () {
        it('should return given type', function () {
            branchInfo.getLocation().should.deep.equal(location);
        });
    });

    describe('getThreads()', function () {
        it('should return given type', function () {
            branchInfo.getThreads().should.deep.equal(threads);
        });
    });

    describe('fromJSON()', function () {
        it('should process branch info', function () {
            var bi = BranchInfo.fromJSON({
                id: 1,
                type: 'if',
                location: location,
                threads: threads
            });
            bi.getId().should.equal(1);
            bi.getType().should.equal('if');
            bi.getLocation().should.deep.equal(location);
            bi.getThreads().should.deep.equal(threads);
        });
    });

    describe('toJSON()', function () {
        it('should process branch info', function () {
            branchInfo.toJSON().should.deep.equal({
                id: 1,
                type: 'if',
                location: location,
                threads: threads
            });
        });
    });
});
