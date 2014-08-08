var fs = require('fs');
var minimatch = require('minimatch');
var Instrumenter = require('./instrumenter');
var BasenameFileSet = require('./basename-file-set');

var instrumenter = new Instrumenter(new BasenameFileSet(), process.cwd());
var sources = process.env.sources ? process.env.sources.split(',') : [];
var tests = process.env.tests ? process.env.tests.split(',') : [];

require.extensions['.js'] = function (module, filename) {
    var relativeFilename = instrumenter.getRelativeFilename(filename);
    var source = fs.readFileSync(filename, 'utf8');
    if (sources.some(function (source) {
        return minimatch(relativeFilename, source);
    })) {
        source = instrumenter.instrument(source, filename);
    } else if (tests.some(function (test) {
        return minimatch(relativeFilename, test);
    })) {
        source = instrumenter.placeMochaActivators(source, filename);
    }
    return module._compile(source, filename);
};
