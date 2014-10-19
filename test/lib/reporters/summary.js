var Instrumenter = require('../../../lib/instrumenter');
var BasenameFileSet = require('../../../lib/file-sets/basename-file-set');
var utils = require('../../_utils');
var vm = require('vm');

var CoverageInfo = require('../../../lib/obj/coverage-info');
var summaryReporter = require('../../../lib/reporters/summary');

describe('reporters/summary', function () {
    var instrumenter;

    beforeEach(function () {
        instrumenter = new Instrumenter(new BasenameFileSet(), __dirname, {apiObjectName: '___unitCoverage___'});
    });

    afterEach(function () {
        utils.cleanupGlobal();
    });

    function run(code) {
        vm.runInThisContext(instrumenter.instrument(code.join('\n'), __dirname + '/code.js'));
        return CoverageInfo.fromJSON(utils.getMap());
    }

    it('should build line and function summary', function () {
        var coverageInfo = run([
            'function f(x) {',
                'switch (x) {',
                    'case 0:',
                        'x++;',
                        'break;',
                    'case 1:',
                        'break;',
                '}',
            '}',
            'function z(){};',
            'f(0);',
            'f(1);'
        ]);

        utils.uncolor(summaryReporter(coverageInfo)).trim().should.equal(
            'Lines 100%\nFunctions 50%\nBranches 100%\nTotal 91%'
        );
    });
});
