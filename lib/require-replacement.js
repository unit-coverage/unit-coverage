var fs = require('fs');
var minimatch = require('minimatch');

var Instrumenter = requireOnce('./instrumenter');
var BasenameFileSet = requireOnce('./basename-file-set');

var instrumenter = new Instrumenter(new BasenameFileSet(), process.cwd());
instrumenter.enableExport(true);
instrumenter.enableReportOnFileSave(true);

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

function requireOnce(filename) {
    var fullname = require.resolve(filename);
    var result = require(fullname);
    cleanupModule(require.cache[fullname]);
    return result;
}

function cleanupModule(module) {
    delete require.cache[module.id];
    delete module.parent;
    module.children.forEach(cleanupModule);
}
