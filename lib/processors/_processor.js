/**
 * Instrumenter processor interface.
 *
 * @name Processor
 * @interface
 */
function Processor() {}

/**
 * @param {Object} ast esprima "Program" node.
 * @param {CoverageInfo} coverageInfo
 * @param {Source} source
 */
Processor.prototype.process = function (ast, coverageInfo, source) {};
