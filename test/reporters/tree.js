var Instrumenter = require('../../lib/instrumenter');
var BasenameFileSet = require('../../lib/basename-file-set');
var utils = require('./../_utils');
var vm = require('vm');

var CoverageInfo = require('../../lib/obj/coverage-info');
var treeReporter = require('../../reporters/tree');

describe('reporters/tree', function () {
    var instrumenter;

    beforeEach(function () {
        instrumenter = new Instrumenter(new BasenameFileSet(), __dirname, {
            varPrefix: '___', varPostfix: '___'
        });
    });

    afterEach(function () {
        utils.cleanupGlobal();
    });

    function run(code, filename) {
        vm.runInThisContext(instrumenter.instrument(code.join('\n'), __dirname + '/' + filename));
        return CoverageInfo.fromJSON(utils.getMap());
    }

    it('should output a simple tree', function () {
        run([
            'var x = 0;',
            'x++;'
        ], 'lib/file1.js');

        var coverageInfo = run([
            'function f(){}'
        ], 'lib/func/f.js');

        utils.captureConsole();
        treeReporter(coverageInfo);
        utils.uncolor(utils.endCaptureConsole()).should.equal(
            '  lib 75%\n' +
            '    file1.js 100%\n' +
            '    func 50%\n' +
            '      f.js 50%\n' +
            '\n' +
            'Lines 100%\n' +
            'Functions 0%\n' +
            'Branches 100%\n' +
            'Total 75%\n'
        );
    });
});
