/**
 * @name FunctionInfo
 * @param {Number} id
 * @param {String} name
 * @param {Location} location
 * @constructor
 */
function FunctionInfo(id, name, location) {
    this._id = id;
    this._name = name;
    this._location = location;

}

/**
 * @returns {Number}
 */
FunctionInfo.prototype.getId = function () {
    return this._id;
};

/**
 * @returns {String}
 */
FunctionInfo.prototype.getName = function () {
    return this._name;
};

/**
 * @returns {Location}
 */
FunctionInfo.prototype.getLocation = function () {
    return this._location;
};

/**
 * @returns {{id: Number, name: String, location: Location}}
 */
FunctionInfo.prototype.toJSON = function () {
    return {
        id: this._id,
        name: this._name,
        location: this._location
    };
};

/**
 * @param {{id: Number, name: String, location: Location}} json
 * @returns {FunctionInfo}
 */
FunctionInfo.fromJSON = function (json) {
    return new FunctionInfo(json.id, json.name, json.location);
};

module.exports = FunctionInfo;
