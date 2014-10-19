var Instrumenter = require('../../../lib/instrumenter');
var BasenameFileSet = require('../../../lib/file-sets/basename-file-set');
var utils = require('../../_utils');
var vm = require('vm');

var CoverageInfo = require('../../../lib/obj/coverage-info');
var lcovReporter = require('../../../lib/reporters/lcov');

describe('reporters/lcov', function () {
    var instrumenter;

    beforeEach(function () {
        instrumenter = new Instrumenter(new BasenameFileSet(), __dirname, {apiObjectName: '___unitCoverage___'});
    });

    afterEach(function () {
        utils.cleanupGlobal();
    });

    function run(code, filename) {
        vm.runInThisContext(instrumenter.instrument(code.join('\n'), __dirname + '/' + filename));
        return CoverageInfo.fromJSON(utils.getMap());
    }

    it('should build line and function LCOV', function () {
        run([
            'var x = true ? 1 : 0;',
            'x++;'
        ], 'lib/file1.js');

        var coverageInfo = run([
            'function f(){}',
            'function z(){}',
            'f();'
        ], 'lib/func/f.js');

        lcovReporter(coverageInfo).trim().should.equal([
            'TN:file1',
            'SF:' + process.cwd() + '/lib/file1.js',
            'FNF:0',
            'FNH:0',
            'DA:1,1',
            'DA:2,1',
            'LF:2',
            'LH:2',
            'BRDA:1,1,0,1',
            'BRDA:1,1,1,0',
            'BRF:1',
            'BRH:0',
            'end_of_record',

            'TN:f',
            'SF:' + process.cwd() + '/lib/func/f.js',
            'FN:1,f',
            'FNDA:1,f',
            'FN:2,z',
            'FNDA:0,z',
            'FNF:2',
            'FNH:1',
            'DA:1,1',
            'DA:2,1',
            'DA:3,1',
            'LF:3',
            'LH:3',
            'BRF:0',
            'BRH:0',
            'end_of_record'
        ].join('\n'));
    });
});
