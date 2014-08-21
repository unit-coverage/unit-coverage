/*jshint undef: false*/
(function () {
    var global = this;
    var map = __MAP__;
    if (global.__MAP_VAR_NAME__) {
        for (var i in map) {
            if (map.hasOwnProperty(i) && !global.__MAP_VAR_NAME__.hasOwnProperty(i)) {
                global.__MAP_VAR_NAME__[i] = map[i];
            }
        }
    } else {
        global.__MAP_VAR_NAME__ = map;

        // Switch between tests
        var currentTestName;
        global.__SWITCH_TEST_FUNCTION_NAME__ = function (newTestName) {
            currentTestName = newTestName;
        };

        // Counters
        global.__LINE_COUNT_FUNCTION_NAME__ = function (filename, lineNumber) {
            if (!currentTestName || map[filename].testName === currentTestName) {
                map[filename].stat.lines[lineNumber] = (map[filename].stat.lines[lineNumber] || 0) + 1;
            }
        };
        global.__FUNCTION_COUNT_FUNCTION_NAME__ = function (filename, functionId) {
            if (!currentTestName || map[filename].testName === currentTestName) {
                map[filename].stat.functions[functionId] = (map[filename].stat.functions[functionId] || 0) + 1;
            }
        };
        global.__BRANCH_COUNT_FUNCTION_NAME__ = function (filename, branchId, threadId, altThreadId, condition) {
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
        global.__INIT_FUNCTION_NAME__ = function () {
            if (!initialized) {
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
        global.__SAVE_FUNCTION_NAME = function () {
            if (!saved) {
                saved = true;
                if (__EXPORT__) {
                    require('fs').writeFileSync(__EXPORT_FILENAME__, JSON.stringify(__MAP_VAR_NAME__));
                    if (__REPORT_ON_FILE_SAVE__) {
                        console.log('Coverage saved: ' + __EXPORT_FILENAME__);
                    }
                }
            }
        };

        // Export as API if needed
        var exportApiObjectKey = '__EXPORT_API_OBJECT__';
        if (exportApiObjectKey) {
            global[exportApiObjectKey] = {
                getCoverageData: function () {
                    return global.__MAP_VAR_NAME__;
                },
                initialize: global.__INIT_FUNCTION_NAME__,
                save: global.__SAVE_FUNCTION_NAME,
                beginTest: global.__SWITCH_TEST_FUNCTION_NAME__,
                endTest: function () {
                    global.__SWITCH_TEST_FUNCTION_NAME__('__NO_TEST_PLACEHOLDER__');
                }
            };
        }
    }
})();
