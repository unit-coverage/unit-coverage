module.exports = {
    Instrumenter: require('./lib/instrumenter'),
    fileSets: {
        SimpleFileSet: require('./lib/file-sets/simple-file-set'),
        BasenameFileSet: require('./lib/file-sets/basename-file-set')
    },
    reporters: {
        summary: require('./lib/reporters/summary'),
        tree: require('./lib/reporters/tree'),
        html: require('./lib/reporters/html'),
        lcov: require('./lib/reporters/lcov'),
        teamcity: require('./lib/reporters/teamcity')
    },
    testDrivers: {
        MochaTestDriver: require('./lib/test-drivers/mocha-test-driver'),
        MochaPhantomTestDriver: require('./lib/test-drivers/mocha-phantom-test-driver')
    },
    obj: {
        CoverageInfo: require('./lib/obj/coverage-info'),
        FileInfo: require('./lib/obj/file-info'),
        FunctionInfo: require('./lib/obj/function-info'),
        BranchInfo: require('./lib/obj/branch-info'),
        StatInfo: require('./lib/obj/stat-info'),
        SummaryInfo: require('./lib/obj/summary-info')
    }
};
