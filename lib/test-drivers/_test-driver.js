/**
 * @name TestDriver
 * @interface
 */

/**
 * @name TestDriver.prototype.configure
 * @param {Object} options
 * @param {String} options.apiObjectName
 * @param {FileSet} options.fileSet
 */

/**
 * @name TestDriver.prototype.process
 * @param {Source} source
 */

/**
 * @name TestDriver.prototype.run
 * @param {TestDriverOptions} options
 * @returns {vow.Promise}
 */

/**
 * @typedef {Object} TestDriverOptions
 * @property {String} bin
 * @property {String} outputFilename
 * @property {String[]} sources
 * @property {String[]} tests
 * @property {String[]} runnerArgs
 * @property {String} fileSetName
 * @property {Object} fileSetOptions
 * @property {String} apiObjectName
 * @property {String} quiet
 * @property {Boolean} exludeInitCoverage
 */
