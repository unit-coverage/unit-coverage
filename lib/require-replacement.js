if (process.env.SEPARATED_COVERAGE_OPTS) {
    var fs = require('fs');
    var minimatch = require('minimatch');
    var path = require('path');

    var options = JSON.parse(process.env.SEPARATED_COVERAGE_OPTS);

    var testDrivers = requireOnce('./test-drivers/test-drivers');
    var Instrumenter = requireOnce('./instrumenter');
    var fileSets = requireOnce('./file-sets/file-sets');

    var fileSet = fileSets.create(options.fileSetName);
    fileSet.configure(options.fileSetOptions);

    var sourceRoot = process.cwd();
    var instrumenter = new Instrumenter(fileSet, sourceRoot, {
        testDriver: testDrivers.create(options.testDriver),
        export: true,
        exportFilename: options.outputFilename,
        reportOnFileSave: true,
        apiObjectName: options.apiObjectName,
        exludeInitCoverage: options.exludeInitCoverage
    });

    var sources = options.sources;
    var tests = options.tests;
    var excludes = options.excludes;

    require.extensions['.js'] = function (module, filename) {
        var relativeFilename = path.relative(sourceRoot, filename);
        var source = fs.readFileSync(filename, 'utf8');
        if (!excludes.some(function (exclude) {
            return minimatch(relativeFilename, exclude);
        })) {
            if (tests.some(function (test) {
                return minimatch(relativeFilename, test);
            })) {
                source = instrumenter.instrumentTests(source, filename);
            } else if (sources.some(function (source) {
                return minimatch(relativeFilename, source);
            })) {
                source = instrumenter.instrument(source, filename);
            }
        }
        return module._compile(source, filename);
    };
}

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
