var globalVarPrefix = '__sepCoverage';

require('chai').should();

module.exports = {
    cleanupGlobal: function () {
        for (var i in global) {
            if (global.hasOwnProperty(i)) {
                if (i.indexOf(globalVarPrefix) === 0) {
                    delete global[i];
                }
            }
        }
    },
    getMap: function () {
        return global.__sepCoverageMap__;
    }
};
