// Note! This is PhantomJS environemt!
var system = require('system');
var args = system.args;

module.exports = {
    afterEnd: function (reporter) {
        var options = JSON.parse(args[args.length - 1]).settings;
        /*jshint evil: true*/
        var result = reporter.page.evaluate(new Function(
            'var variable = window.__unitCoverage__.getCoverageData();' +
            'return typeof variable === "object" ? JSON.stringify(variable) : variable;'
        ));

        if (!result) {
            return;
        }
        require('fs').write(options.outputFilename, result);
    }
};
