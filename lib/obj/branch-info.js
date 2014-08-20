/**
 * @typedef {Object} BranchThread
 * @param {Number} index
 * @param {Location} location
 */

/**
 * @name BranchInfo
 * @param {Number} id
 * @param {String} type
 * @param {Location} location
 * @param {BranchThread[]} threads
 * @constructor
 */
function BranchInfo(id, type, location, threads) {
    this._id = id;
    this._type = type;
    this._location = location;
    this._threads = threads;
}

/**
 * @returns {Number}
 */
BranchInfo.prototype.getId = function () {
    return this._id;
};

/**
 * @returns {String}
 */
BranchInfo.prototype.getType = function () {
    return this._type;
};

/**
 * @returns {Location}
 */
BranchInfo.prototype.getLocation = function () {
    return this._location;
};

/**
 * @returns {BranchThread[]}
 */
BranchInfo.prototype.getThreads = function () {
    return this._threads;
};

BranchInfo.prototype.toJSON = function () {
    return {
        id: this._id,
        type: this._type,
        location: this._location,
        threads: this._threads
    };
};

BranchInfo.fromJSON = function (json) {
    return new BranchInfo(json.id, json.type, json.location, json.threads);
};

module.exports = BranchInfo;
