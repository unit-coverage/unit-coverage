var Entities = require('html-entities').XmlEntities;
var entities = new Entities();

var path = require('path');

var Summary = require('../obj/summary-info');

/**
 * @param {Number} level
 * @returns {String}
 */
function padding(level) {
    return new Array(level + 1).join('  ');
}

/**
 * @param {String} name
 * @param {Object} attrs
 * @param {Number} level
 * @param {Boolean=} closed
 * @returns {String}
 */
function xmlnode(name, attrs, level, closed) {
    var attributes = [];

    Object.keys(attrs).forEach(function (key) {
        attributes.push(
            key + '="' + entities.encode(String(attrs[key])) + '"'
        );
    });

    return padding(level) +
        '<' + name + ' ' + attributes.join(' ') + (closed ? '/' : '') + '>\n';
}

/**
 * @param {SummaryInfo} summary
 * @param {Number} level
 * @param {Object=} additionalMetrics
 */
function getMetricsNodeText(summary, level, additionalMetrics) {
    var metrics = {
        statements: summary.getLineCount(),
        coveredstatements: summary.getCoveredLineCount(),
        conditionals: summary.getBranchCount(),
        coveredconditionals: summary.getCoveredBranchCount(),
        methods: summary.getFunctionCount(),
        coveredmethods: summary.getCoveredFunctionCount()
    };

    metrics.loc = metrics.ncloc = metrics.statements;

    metrics.elements = metrics.statements + metrics.conditionals + metrics.methods;
    metrics.coveredelements = metrics.coveredstatements + metrics.coveredconditionals +
        metrics.coveredmethods;

    if (additionalMetrics) {
        Object.keys(additionalMetrics).forEach(function (key) {
            metrics[key] = additionalMetrics[key];
        });
    }

    return xmlnode('metrics', metrics, level, true);
}

/**
 * @param {FileInfo} fileInfo
 * @param {Number} level
 */
function getFileNodeText(fileInfo, level) {
    var statInfo = fileInfo.getStatInfo();
    var filename = fileInfo.getFilename();
    var lines = {};

    var result = xmlnode('file', {
        name: path.basename(filename),
        path: filename
    }, level);

    result += getMetricsNodeText(fileInfo.getStatInfo().calcSummary(), level + 1);

    statInfo.getLineNumbers().forEach(function (lineNumber) {
        lines[lineNumber] = {
            num: lineNumber,
            type: 'stmt',
            count: statInfo.getLineCallCount(lineNumber)
        };
    });

    fileInfo.getFunctionIds().forEach(function (functionId) {
        /** @type {FunctionInfo} */
        var functionInfo = fileInfo.getFunctionInfo(functionId);
        var startLine = functionInfo.getLocation().start.line;

        lines[startLine] = {
            num: startLine,
            type: 'stmt',
            count: statInfo.getFunctionCallCount(functionId)
        };
    });

    fileInfo.getBranchIds().forEach(function (branchId) {
        /** @type {BranchInfo} */
        var branchInfo = fileInfo.getBranchInfo(branchId);
        var branchType = branchInfo.getType();
        var startLine = branchInfo.getLocation().start.line;

        var isCondition = false;
        var trueCount = 0;
        var falseCount = 0;
        var totalCount = 0;

        branchInfo.getThreads().forEach(function (thread) {
            var callCount = statInfo.getBranchThreadCallCount(branchId, thread.id);

            switch (branchType) {
                case 'SwitchStatement':
                    isCondition = true;
                    trueCount += callCount;
                    break;
                case 'LogicalExpression':
                case 'ConditionalExpression':
                case 'IfStatement':
                    isCondition = true;

                    if (thread.id > 0) {
                        falseCount += callCount;
                    } else {
                        trueCount += callCount;
                    }
                    break;
                default:
                    totalCount += callCount;
                    break;
            }
        });

        lines[startLine] = {
            num: startLine,
            type: isCondition ? 'cond' : 'stmt'
        };

        if (isCondition) {
            lines[startLine].truecount = trueCount;
            lines[startLine].falsecount = falseCount;
        } else {
            lines[startLine].count = totalCount;
        }
    });

    Object.keys(lines).forEach(function (lineNumber) {
        result += xmlnode('line', lines[lineNumber], level + 1, true);
    });

    return result + padding(level) + '</file>\n';
}

/**
 * @param {String} packageName
 * @param {FileInfo[]} fileInfos
 * @param {Number} level
 */
function getPackageNodeText(packageName, fileInfos, level) {
    var result = xmlnode('package', {
        name: packageName
    }, level);

    fileInfos
        .sort(
            /**
             * @param {FileInfo} info1
             * @param {FileInfo} info2
             **/
            function (info1, info2) {
                return info1.getFilename().localeCompare(info2.getFilename());
            }
        )
        .forEach(/** @param {FileInfo} fileInfo */ function (fileInfo) {
            result += getFileNodeText(fileInfo, level + 1);
        });

    return result + padding(level) + '</package>\n';
}

/**
 * @param {CoverageInfo} coverageInfo
 * @param {Number} level
 */
function getProjectNodeText(coverageInfo, level) {
    var projectSummary = new Summary();
    var fileInfos = coverageInfo.getFileInfos();
    var packages = {};
    var additionalMetrics = {};
    var result = xmlnode('project', {
        timestamp: Date.now(),
        name: 'All files'
    }, level);

    fileInfos.forEach(/** @param {FileInfo} fileInfo */ function (fileInfo) {
        var summary = fileInfo.getStatInfo().calcSummary();
        var packageName = path.dirname(fileInfo.getFilename());

        if (packages[packageName] === undefined) {
            packages[packageName] = [];
        }

        packages[packageName].push(fileInfo);

        projectSummary.add(summary);
    });

    additionalMetrics.packages = Object.keys(packages).length;
    additionalMetrics.files = fileInfos.length;
    additionalMetrics.classes = fileInfos.length;

    result += getMetricsNodeText(projectSummary, level + 1, additionalMetrics);

    Object.keys(packages).sort().forEach(function (packageName) {
        result += getPackageNodeText(packageName, packages[packageName], level + 1);
    });

    return result + padding(level) + '</project>\n';
}

module.exports = function (coverageInfo) {
    var result = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        xmlnode('coverage', {
            generated: Date.now(),
            clover: '3.2.0'
        }, 1);

    result += getProjectNodeText(coverageInfo, 1) + '</coverage>';

    return result;
};
