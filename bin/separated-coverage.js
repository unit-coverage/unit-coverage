#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

var args = process.argv.slice(2);
var command = args.shift();

switch (command) {
    case "report":
        var inputParams = parseArguments(args);
        var reporterName = inputParams['reporter'] || 'tree';
        var input = inputParams['input'];
        if (!input) {
            throw new Error('"input" argument is not specified');
        }
        require('../reporters/' + reporterName)(
            JSON.parse(fs.readFileSync(input, 'utf8'))
        );
        break;
    case "run":
        args.push('-k', path.resolve(__dirname, '../hooks/phantom-dump-coverage.js'));
        childProcess.spawn(args.shift(), args, {stdio: [process.stdin, process.stdout, process.stderr]}).on(
            'close',
            function (code) {
                process.exit(code);
            });
        break;
    case "run-mocha":
        var preMochaArgs = [];
        var argVal;
        while ((argVal = args.shift()) !== undefined) {
            if (argVal === '--') {
                break;
            } else {
                preMochaArgs.push(argVal);
            }
        }
        var params = parseArguments(preMochaArgs);
        var mochaBin = fs.realpathSync(params.bin);
        var mochaArgs = args.concat('--compilers', 'js:separated-coverage/lib/require-replacement');

        process.env.tests = params.tests;
        process.env.sources = params.sources;
        childProcess.spawn(
            mochaBin,
            mochaArgs,
            {stdio: [process.stdin, process.stdout, process.stderr], env: process.env}
        ).on('close', function (code) {
            process.exit(code);
        });
        break;
}

function parseArguments(args) {
    var inputParams = {};
    while (args.length > 0) {
        var argName = args.shift().replace('--', '');
        inputParams[argName] = args.shift();
    }
    return inputParams;
}
