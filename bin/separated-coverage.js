#!/usr/bin/env node
var fs = require('fs');
var docopt = require('docopt-mult-args').docopt;
var Runner = require('../lib/runner');
var version = 'v' + require('../package.json').version;

var info = fs.readFileSync(__dirname + '/cli.info', 'utf8').replace('{version}', version);

var opt = docopt(info, {version: version});
var runner = new Runner();

if (opt['--profile']) {
    var profileName = opt['--profile'];
    var packageFilename = process.cwd() + '/package.json';
    var packageInfo = JSON.parse(fs.readFileSync(packageFilename, 'utf8'));
    var sepCoveragePackageInfo = packageInfo['separated-coverage'];
    if (!sepCoveragePackageInfo) {
        throw new Error('No "separated-coverage" section in "' + packageFilename + '"');
    }
    var profile = sepCoveragePackageInfo[profileName];
    if (!profile) {
        throw new Error(
            'No profile "' + profileName + '" at "separated-coverage" section in "' + packageFilename + '"'
        );
    }
    var args = process.argv.slice(2);
    args = args.concat(profile);
    opt = docopt(info, {version: version, argv: args});
}

var fileSetOptions = {};
if (opt['--set-opt']) {
    opt['--set-opt'].forEach(function (name, i) {
        fileSetOptions[name] = opt['--set-opt-val'][i] || '';
    });
}
if (opt['--sources'].length === 0) {
    opt['--sources'] = ['**/*.js'];
}
if (opt['--tests'].length === 0) {
    opt['--tests'] = ['**/*.test.js'];
}
if (opt.run) {
    runner.run({
        testDriver: opt['--driver'],
        reporter: opt['--reporter'],
        additional: opt['--additional'],
        sources: opt['--sources'],
        excludes: opt['--excludes'],
        tests: opt['--tests'],
        bin: opt['--bin'],
        apiObjectName: opt['--api-object-name'],
        runnerArgs: opt['<runner-args>'],
        fileSetName: opt['--set'],
        fileSetOptions: fileSetOptions,
        quiet: opt['--quiet'],
        exludeInitCoverage: !opt['--include-init-coverage'],
        filename: opt['--file'],
        reportOutputFilename: opt['--output']
    }).done();
} else if (opt.report) {
    runner.report({
        additional: opt['--additional'],
        sources: opt['--sources'],
        excludes: opt['--excludes'],
        reporter: opt['--reporter'],
        fileSetName: opt['--set'],
        fileSetOptions: fileSetOptions,
        filename: opt['<coverage-file>'],
        reportOutputFilename: opt['--output'],
        quiet: opt['--quiet']
    }).done();
} else if (opt.instrument) {
    runner.instrument({
        paths: opt['<path>'],
        testDriver: opt['--driver'],
        sources: opt['--sources'],
        excludes: opt['--excludes'],
        tests: opt['--tests'],
        apiObjectName: opt['--api-object-name'],
        fileSetName: opt['--set'],
        fileSetOptions: fileSetOptions,
        quiet: opt['--quiet'],
        exludeInitCoverage: !opt['--include-init-coverage'],
        filename: opt['--file'],
        export: !opt['--no-export']
    }).done();
}
