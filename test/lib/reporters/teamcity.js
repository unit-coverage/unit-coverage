var Instrumenter = require('../../../lib/instrumenter');
var BasenameFileSet = require('../../../lib/file-sets/basename-file-set');
var utils = require('../../_utils');
var vm = require('vm');

var CoverageInfo = require('../../../lib/obj/coverage-info');
var teamcityReporter = require('../../../lib/reporters/teamcity');

describe('reporters/teamcity', function () {
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

    it('should build line summary', function () {
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
            'f(0);'
        ]);

        teamcityReporter(coverageInfo).trim().should.equal([
            '##teamcity[blockOpened name=\'Code Coverage SummaryInfo\']',
            '##teamcity[buildStatisticValue key=\'CodeCoverageB\' value=\'85.71\']',
            '##teamcity[buildStatisticValue key=\'CodeCoverageAbsLCovered\' value=\'6\']',
            '##teamcity[buildStatisticValue key=\'CodeCoverageAbsLTotal\' value=\'7\']',
            '##teamcity[buildStatisticValue key=\'CodeCoverageL\' value=\'85.71\']',
            '##teamcity[buildStatisticValue key=\'CodeCoverageAbsMCovered\' value=\'1\']',
            '##teamcity[buildStatisticValue key=\'CodeCoverageAbsMTotal\' value=\'2\']',
            '##teamcity[buildStatisticValue key=\'CodeCoverageM\' value=\'50.00\']',
            '##teamcity[blockClosed name=\'Code Coverage SummaryInfo\']'
        ].join('\n'));
    });
});
