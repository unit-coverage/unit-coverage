// Note! This is PhantomJS environemt!

module.exports = {
    afterEnd: function (reporter) {
        /*jshint evil: true*/
        var result = reporter.page.evaluate(new Function(
            'var variable = window.__sepCoverageMap__;' +
            'return typeof variable === "object" ? JSON.stringify(variable) : variable;'
        ));

        if (!result) {
            return;
        }
        require('fs').write('./coverage.json', result);
    }
};
