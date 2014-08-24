var MochaTestDriver = require('./mocha-test-driver');
var MochaPhantomTestDriver = require('./mocha-phantom-test-driver');

module.exports.create = function (name) {
    switch (name) {
        case 'mocha':
            return new MochaTestDriver();
        case 'mocha-phantom':
            return new MochaPhantomTestDriver();
    }
};
