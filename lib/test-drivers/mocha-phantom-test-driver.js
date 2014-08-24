var path = require('path');
var subprocess = require('../utils/subprocess');
var util = require('util');
var MochaTestDriver = require('./mocha-test-driver');

/**
 * @name MochaPhantomTestDriver
 * @augments MochaTestDriver
 * @implements TestDriver
 * @constructor
 */
function MochaPhantomTestDriver() {
    this._fileSet = null;
    this._apiObjectName = null;
}

util.inherits(MochaPhantomTestDriver, MochaTestDriver);

/**
 * @param {TestDriverOptions} options
 */
MochaPhantomTestDriver.prototype.run = function (options) {
    if (!options.bin) {
        options.bin = 'node_modules/.bin/mocha-phantomjs';
    }
    var args = [
        '-k', path.resolve(__dirname, '../../hooks/phantom-dump-coverage.js'),
        '-s', 'outputFilename=' + options.outputFilename
    ].concat(options.runnerArgs);
    return subprocess.run(options.bin, args, {}, options.quiet);
};

module.exports = MochaPhantomTestDriver;
