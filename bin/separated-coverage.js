#!/usr/bin/env node

var args = process.argv.slice(2);
var command = args.shift();
var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

switch (command) {
    case "report":
        var inputParams = {};
        while (args.length > 0) {
            var argName = args.shift().replace('--', '');
            inputParams[argName] = args.shift();
        }
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
}
