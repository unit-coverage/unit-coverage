var childProcess = require('child_process');
var vow = require('vow');

module.exports.run = function (executable, args, options, quiet) {
    var env = {};
    var defer = vow.defer();
    Object.keys(process.env).forEach(function (key) {
        env[key] = process.env[key];
    });
    env.SEPARATED_COVERAGE_OPTS = JSON.stringify(options);
    var subProcess = childProcess.spawn(executable, args, {
        env: env,
        stdio: quiet ? [0, 'ignore', 'pipe'] : [0, 1, 'pipe']
    });
    var stderr = '';
    subProcess.stderr.on('data', function (data) {
        stderr += data;
        if (!quiet) {
            process.stderr.write(data);
        }
    });
    subProcess.on('close', function (code) {
        if (code !== 0) {
            defer.reject(new Error('Command failed: ' + executable + ' ' + args.join(' ') + '\n' + stderr));
        } else {
            defer.resolve();
        }
    });
    return defer.promise();
};
