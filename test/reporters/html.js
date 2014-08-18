var Instrumenter = require('../../lib/instrumenter');
var BasenameFileSet = require('../../lib/basename-file-set');
var utils = require('./../_utils');
var vm = require('vm');

var CoverageInfo = require('../../lib/obj/coverage-info');
var htmlReporter = require('../../reporters/html');

describe('reporters', function () {
    describe('tree', function () {
        var instrumenter;

        beforeEach(function () {
            instrumenter = new Instrumenter(new BasenameFileSet(), __dirname, {
                varPrefix: '___', varPostfix: '___'
            });
        });

        afterEach(function () {
            utils.cleanupGlobal();
            utils.unstubReadFile();
        });

        function run(code, filename) {
            vm.runInThisContext(instrumenter.instrument(code, __dirname + '/' + filename));
            return CoverageInfo.fromJSON(utils.getMap());
        }

        it('should output a valid html', function () {
            var files = {
                'lib/file1.js': [
                    'var x = 0;',
                    'x++;'
                ].join('\n'),

                'lib/func/f.js': 'function f(){}'
            };

            utils.stubReadFile(files);

            run(files['lib/file1.js'], 'lib/file1.js');

            var coverageInfo = run(files['lib/func/f.js'], 'lib/func/f.js');

            utils.captureConsole();
            htmlReporter(coverageInfo);

            var html = utils.endCaptureConsole();

            html.should.contain('<span class="thread-dir"></span>lib<span class="thread-level">75%</span>');
            html.should.contain('<span class="thread-dir"></span>func<span class="thread-level">50%</span>');
            html.should.contain(
                '<span class="thread-file"></span>' +
                '<span class="thread-link-name">file1.js</span>' +
                '<span class="thread-level">100%</span>'
            );
            html.should.contain(
                '<span class="thread-file"></span>' +
                '<span class="thread-link-name">f.js</span>' +
                '<span class="thread-level">50%</span>'
            );

            html.should.contain('<div class="source-file-name">file1.js</div>');
            html.should.contain('<div class="source-file-name">f.js</div>');
        });
    });
});
