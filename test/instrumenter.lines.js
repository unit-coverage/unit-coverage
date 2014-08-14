var Instrumenter = require('../lib/instrumenter');
var BasenameFileSet = require('../lib/basename-file-set');
var utils = require('./utils');
var vm = require('vm');

describe('Instrumenter', function () {
    var instrumenter;
    beforeEach(function () {
        instrumenter = new Instrumenter(new BasenameFileSet(), __dirname);
    });
    afterEach(function () {
        utils.cleanupGlobal();
    });
    function run(code) {
        vm.runInThisContext(instrumenter.instrument(code.join('\n'), __dirname + '/code.js'));
        return utils.getMap()['code.js'];
    }
    describe('lines', function () {
        it('should instrument lines at file root namespace', function () {
            run([
                'var i = 0, x = 0;',
                '',
                'i += 3;',
                '',
                'while (i--)',
                    'x += i;'
            ]).lines.should.deep.equal({
                1: 1,
                3: 1,
                5: 1,
                6: 3
            });
        });
        it('should instrument lines at function scope', function () {
            run([
                'var f = function(x) {',
                    'x++;',
                    'return x;',
                '};',
                '',
                'f(0);'
            ]).lines.should.deep.equal({
                1: 1,
                2: 1,
                3: 1,
                6: 1
            });
        });
        it('should instrument lines at switch scope', function () {
            run([
                'function f(x) {',
                    'switch (x) {',
                        'case 0:',
                            'break;',
                        'case 1:',
                            'break;',
                    '}',
                '}',
                'f(0);'
            ]).lines.should.deep.equal({
                1: 1,
                2: 1,
                4: 1,
                6: 0,
                9: 1
            });
        });
    });
});
