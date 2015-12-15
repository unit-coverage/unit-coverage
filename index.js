module.exports = {
    Instrumenter: require('./lib/instrumenter'),

    fileSets: {
        SimpleFileSet: require('./lib/file-sets/simple-file-set'),
        BasenameFileSet: require('./lib/file-sets/basename-file-set'),
        RelativeFileSet: require('./lib/file-sets/relative-file-set')
    },
    fileSetFactory: require('./lib/file-sets/file-sets'),

    reporters: {
        summary: require('./lib/reporters/summary'),
        tree: require('./lib/reporters/tree'),
        html: require('./lib/reporters/html'),
        lcov: require('./lib/reporters/lcov'),
        teamcity: require('./lib/reporters/teamcity'),
        clover: require('./lib/reporters/clover'),
        json: require('./lib/reporters/json')
    },

    testDrivers: {
        MochaTestDriver: require('./lib/test-drivers/mocha-test-driver'),
        MochaPhantomTestDriver: require('./lib/test-drivers/mocha-phantom-test-driver')
    },
    testDriverFactory: require('./lib/test-drivers/test-drivers'),

    obj: {
        CoverageInfo: require('./lib/obj/coverage-info'),
        FileInfo: require('./lib/obj/file-info'),
        FunctionInfo: require('./lib/obj/function-info'),
        BranchInfo: require('./lib/obj/branch-info'),
        StatInfo: require('./lib/obj/stat-info'),
        SummaryInfo: require('./lib/obj/summary-info')
    }
};
