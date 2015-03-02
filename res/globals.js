/*jshint undef: false*/
module.exports = function () {
    /*jshint evil: true*/
    // Avoiding strict-mode limitations.
    var globalFunc = new Function('return this');
    /*jshint evil: false*/

    var global = globalFunc();
    var exportApiObjectKey = '__EXPORT_API_OBJECT__';
    var map = __MAP__;
    if (global[exportApiObjectKey]) {
        var currentMap = global[exportApiObjectKey].getCoverageData();
        for (var i in map) {
            if (map.hasOwnProperty(i) && !currentMap.hasOwnProperty(i)) {
                currentMap[i] = map[i];
            }
        }
    } else {
        // Switch between tests
        var currentTestName;
        var beginTest = function (newTestName) {
            currentTestName = newTestName;
        };
        var endTest = function () {
            currentTestName = '__NO_TEST_PLACEHOLDER__';
        };

        // Counters
        var countLine = function (filename, lineNumber) {
            if (!currentTestName || map[filename].testName === currentTestName) {
                map[filename].stat.lines[lineNumber] = (map[filename].stat.lines[lineNumber] || 0) + 1;
            }
        };
        var countFunction = function (filename, functionId) {
            if (!currentTestName || map[filename].testName === currentTestName) {
                map[filename].stat.functions[functionId] = (map[filename].stat.functions[functionId] || 0) + 1;
            }
        };
        var countBranch = function (filename, branchId, threadId, altThreadId, condition) {
            if (!currentTestName || map[filename].testName === currentTestName) {
                if (arguments.length === 5 && !condition) {
                    threadId = altThreadId;
                }
                map[filename].stat.branches[branchId][threadId]++;
            }
            return condition;
        };

        // Remove init coverage data
        var initialized = false;
        var initialize = function () {
            if (!initialized && __EXCLUDE_INIT_COVERAGE__) {
                initialized = true;
                Object.keys(map).forEach(function (filename) {
                    var fileInfo = map[filename];
                    fileInfo.initStat = fileInfo.initStat || {
                        lines: {}, functions: {}
                    };
                    var lines = fileInfo.stat.lines;
                    Object.keys(lines).forEach(function (lineNumber) {
                        if (lines[lineNumber] > 0) {
                            fileInfo.initStat.lines[lineNumber] = lines[lineNumber];
                            delete lines[lineNumber];
                        }
                    });
                    var functions = fileInfo.stat.functions;
                    Object.keys(functions).forEach(function (functionId) {
                        if (functions[functionId] > 0) {
                            fileInfo.initStat.functions[functionId] = functions[functionId];
                            delete functions[functionId];
                        }
                    });
                });
            }
        };

        // Save to file
        var saved = false;
        var save = function () {
            if (!saved) {
                saved = true;
                if (__EXPORT__) {
                    try {
                        require('fs').writeFileSync(__EXPORT_FILENAME__, JSON.stringify(map));
                        if (__REPORT_ON_FILE_SAVE__) {
                            console.error('Coverage saved: ' + __EXPORT_FILENAME__);
                        }
                    } catch (e) {
                        if (__REPORT_ON_FILE_SAVE__) {
                            console.error('Could not save: ' + __EXPORT_FILENAME__);
                        }
                    }
                }
            }
        };

        // Export as API
        global[exportApiObjectKey] = {
            getCoverageData: function () {
                return map;
            },
            initialize: initialize,
            save: save,
            beginTest: beginTest,
            endTest: endTest,
            countLine: countLine,
            countFunction: countFunction,
            countBranch: countBranch
        };
    }
};
