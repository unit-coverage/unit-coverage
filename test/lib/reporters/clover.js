var Instrumenter = require('../../../lib/instrumenter');
var BasenameFileSet = require('../../../lib/file-sets/basename-file-set');
var utils = require('../../_utils');
var vm = require('vm');

var CoverageInfo = require('../../../lib/obj/coverage-info');
var cloverReporter = require('../../../lib/reporters/clover');

describe('reporters/clover', function () {
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

    it('should build valid xml', function () {
        var coverageInfo;

        run([
            'var x = 0;',
            'x += x ? 2 : 1;'
        ], 'lib/file1.js');

        run([
            'var x = 0;',
            'x += x ? 1 : 2;'
        ], 'lib/file2.js');

        coverageInfo = run([
            'function f(x) {',
                'if (x < 0) {',
                    'x = 10;',
                '}',
                'switch (x) {',
                    'case 0:',
                        'x++;',
                        'break;',
                    'case 2:',
                        'x += 2;',
                        'break;',
                    'case 1:',
                        'break;',
                '}',
            '}',
            'function z(){};',
            'f(0);',
            'f(2);'
        ], 'lib/func/f.js');

        var xml = cloverReporter(coverageInfo);

        xml.should.contain('<package name="lib">');
        xml.should.contain('<package name="lib/func">');
        xml.should.contain('<line num="2" type="cond" truecount="0" falsecount="2"/>');
        xml.should.contain('statements="12" coveredstatements="10" conditionals="2"');
    });
});
