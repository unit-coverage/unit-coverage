if (process.env.UNIT_COVERAGE_INTERNAL_OPTS) {
    var fs = require('fs');
    var minimatch = require('minimatch');
    var path = require('path');

    var options = JSON.parse(process.env.UNIT_COVERAGE_INTERNAL_OPTS);

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

    function processFile(filename) {
        var relativeFilename = path.relative(sourceRoot, filename);
        var source = fs.readFileSync(filename, 'utf8');
        if (!excludes.some(
            function (exclude) {
                return minimatch(relativeFilename, exclude);
            }
        )) {
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
        return source;
    }

    var previousExtension = require.extensions['.js'];
    if (isBuiltinJsExtension(previousExtension)) {
        require.extensions['.js'] = function (module, filename) {
            return module._compile(processFile(filename), filename);
        };
    } else {
        // Hack for babel and other transpilers.
        var originalReadFileSync = fs.readFileSync;
        var processedFiles = Object.create(null);
        fs.readFileSync = function(filename) {
            if (filename in processedFiles) {
                return processedFiles[filename];
            } else {
                return originalReadFileSync.apply(fs, arguments);
            }
        };
        require.extensions['.js'] = function (module, filename) {
            processedFiles[filename] = processFile(filename);
            previousExtension(module, filename);
            delete processedFiles[filename];
        };
    }
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

function isBuiltinJsExtension(func) {
    return func.toString() === [
        'function (module, filename) {',
        '  var content = fs.readFileSync(filename, \'utf8\');',
        '  module._compile(stripBOM(content), filename);',
        '}'
    ].join('\n');
}
