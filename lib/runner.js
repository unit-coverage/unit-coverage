var path = require('path');
var minimatch = require('minimatch');
var vow = require('vow');
var vowFs = require('vow-fs');
var CoverageInfo = require('./obj/coverage-info');
var Instrumenter = require('./instrumenter');
var fileSets = require('./file-sets/file-sets');

var testDrivers = require('./test-drivers/test-drivers');

var reporters = {
    html: require('./reporters/html'),
    summary: require('./reporters/summary'),
    teamcity: require('./reporters/teamcity'),
    clover: require('./reporters/clover'),
    tree: require('./reporters/tree'),
    lcov: require('./reporters/lcov')
};

function Runner() {}

/**
 * @param {Object} options
 * @param {String} [options.testDriver]
 * @param {String} [options.bin]
 * @param {String} [options.reporter]
 * @param {String[]} [options.excludes]
 * @param {String[]} [options.sources]
 * @param {String[]} [options.tests]
 * @param {String} [options.filename]
 * @param {String} options.fileSetName
 * @param {Object} [options.fileSetOptions]
 * @param {String} [options.apiObjectName]
 * @param {String[]} [options.runnerArgs]
 * @param {Boolean} [options.quiet]
 * @param {Boolean} [options.exludeInitCoverage]
 * @param {String} [options.reportOutputFilename]
 * @returns {vow.Promise}
 */
Runner.prototype.run = function (options) {
    var _this = this;
    return vow.fulfill().then(function () {
        var testDriver = testDrivers.create(options.testDriver);
        if (!testDriver) {
            throw new Error('Driver "' + options.testDriver + '" not found');
        }

        var deleteOutputFile = !options.filename;

        return (options.filename ? vow.fulfill(options.filename) : vowFs.makeTmpFile({
            prefix: 'coverage', ext: '.json'
        })).then(function (outputFilename) {
            return testDriver.run({
                bin: options.bin,
                excludes: options.excludes || [],
                sources: options.sources,
                tests: options.tests,
                fileSetName: options.fileSetName,
                fileSetOptions: options.fileSetOptions,
                apiObjectName: options.apiObjectName,
                runnerArgs: options.runnerArgs,
                outputFilename: outputFilename,
                quiet: options.quiet,
                exludeInitCoverage: options.exludeInitCoverage
            }).then(function () {
                return _this.report({
                    filename: outputFilename,
                    reporter: options.reporter,
                    additional: options.additional,
                    sources: options.sources,
                    tests: options.tests,
                    excludes: options.excludes,
                    fileSetName: options.fileSetName,
                    fileSetOptions: options.fileSetOptions,
                    reportOutputFilename: options.reportOutputFilename,
                    quiet: options.quiet
                }).then(function () {
                    if (deleteOutputFile) {
                        return vowFs.remove(outputFilename);
                    }
                });
            });
        });
    });
};

/**
 * @param {Object} options
 * @param {String} options.filename
 * @param {String} options.reporter
 * @param {String[]} [options.additional]
 * @param {String[]} [options.sources]
 * @param {String[]} [options.excludes]
 * @param {String} options.fileSetName
 * @param {Object} options.fileSetOptions
 * @param {String} [options.reportOutputFilename]
 * @param {Boolean} [options.quiet]
 * @returns {vow.Promise}
 */
Runner.prototype.report = function (options) {
    var _this = this;
    var root = process.cwd();
    return vowFs.read(options.filename, 'utf8').then(function (jsonString) {
        var reporter = reporters[options.reporter];
        if (!reporter) {
            throw new Error('Reporter "' + options.reporter + '" not found');
        }

        var coverageInfo = CoverageInfo.fromJSON(JSON.parse(jsonString));

        return vow.all(options.additional.map(function (filename) {
            return _this._collectFiles(path.resolve(root, filename), options.excludes, root);
        })).then(function (files) {
            files = Array.prototype.concat.apply([], files);
            files = files.filter(function (filename) {
                var relativePath = path.relative(root, filename);
                return !coverageInfo.getFileInfo(relativePath) &&
                    !filenameMatchesSomeOf(relativePath, options.tests) &&
                    filenameMatchesSomeOf(relativePath, options.sources);
            });

            var additionalInfoPromise;
            if (files.length > 0) {
                var fileSet = fileSets.create(options.fileSetName);
                fileSet.configure(options.fileSetOptions);
                var instrumenter = new Instrumenter(fileSet, root);
                additionalInfoPromise = vow.all(files.map(function (filename) {
                    return vowFs.read(filename, 'utf8').then(function (content) {
                        try {
                            coverageInfo.add(instrumenter.generateCoverageInfo(content, filename));
                        } catch (e) {
                            e.message = 'File "' + filename + '": ' + e.message;
                            throw e;
                        }
                    });
                }));
            } else {
                additionalInfoPromise = vow.fulfill();
            }
            return additionalInfoPromise.then(function () {
                var report = reporter(coverageInfo);
                if (options.reportOutputFilename) {
                    return vowFs.write(options.reportOutputFilename, report, 'utf8').then(function () {
                        if (!options.quiet) {
                            console.log('Report saved: ' + options.reportOutputFilename);
                        }
                    });
                } else {
                    process.stdout.write(report);
                }
            });
        });
    });
};

/**
 * @param {Object} options
 * @param {String} options.paths
 * @param {String} [options.testDriver]
 * @param {String} [options.reporter]
 * @param {String[]} [options.excludes]
 * @param {String[]} [options.sources]
 * @param {String[]} [options.tests]
 * @param {String} [options.filename]
 * @param {String} options.fileSetName
 * @param {Object} [options.fileSetOptions]
 * @param {String} [options.apiObjectName]
 * @param {Boolean} [options.quiet]
 * @param {Boolean} [options.exludeInitCoverage]
 * @param {Boolean} [options.export]
 */
Runner.prototype.instrument = function (options) {
    var _this = this;
    var root = process.cwd();
    return vow.all(options.paths.map(function (filename) {
        return _this._collectFiles(path.resolve(root, filename), options.excludes, root);
    })).then(function (files) {
        files = Array.prototype.concat.apply([], files);
        var sourceMasks = options.sources;
        var testMasks = options.tests;
        var testDriver = testDrivers.create(options.testDriver);
        if (!testDriver) {
            throw new Error('Driver "' + options.testDriver + '" not found');
        }
        var fileSet = fileSets.create(options.fileSetName);
        fileSet.configure(options.fileSetOptions);
        var instrumenter = new Instrumenter(fileSet, root, {
            export: options.export,
            testDriver: testDriver,
            reportOnFileSave: !options.quiet,
            exportFilename: options.filename,
            apiObjectName: options.apiObjectName
        });
        return vow.all(files.map(function (filename) {
            var relativePath = path.relative(root, filename);
            if (filenameMatchesSomeOf(relativePath, testMasks)) {
                return vowFs.read(filename, 'utf8').then(function (content) {
                    return vowFs.write(filename, instrumenter.instrumentTests(content, filename));
                }).then(function () {
                    if (!options.quiet) {
                        console.log('Test: ' + filename);
                    }
                });
            } else if (filenameMatchesSomeOf(relativePath, sourceMasks)) {
                return vowFs.read(filename, 'utf8').then(function (content) {
                    return vowFs.write(filename, instrumenter.instrument(content, filename));
                }).then(function () {
                    if (!options.quiet) {
                        console.log('Source: ' + filename);
                    }
                });
            }
        }));
    });
};

Runner.prototype._collectFiles = function (filename, excludes, root) {
    var _this = this;
    if (!filenameMatchesSomeOf(path.relative(root, filename), excludes)) {
        return vowFs.stat(filename).then(function (stat) {
            if (stat.isDirectory()) {
                return vowFs.listDir(filename).then(function (items) {
                    return vow.all(items.map(function (item) {
                        return _this._collectFiles(path.join(filename, item), excludes, root);
                    })).then(function (results) {
                        return Array.prototype.concat.apply([], results);
                    });
                });
            } else {
                return [filename];
            }
        });
    } else {
        return vow.fulfill([]);
    }
};

module.exports = Runner;

/**
 * @param {String} filename
 * @param {String} pattern
 */
function filenameMatches(filename, pattern) {
    return minimatch(filename, pattern);
}

/**
 * @param {String} filename
 * @param {String[]} patterns
 */
function filenameMatchesSomeOf(filename, patterns) {
    return patterns.some(function (exclude) {
        return filenameMatches(filename, exclude);
    });
}
