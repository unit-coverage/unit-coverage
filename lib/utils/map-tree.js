var Summary = require('../obj/summary');

/**
 * @param {CoverageInfo} coverageInfo
 */
module.exports.buildTree = function (coverageInfo) {
    var tree = new Node(null, null);
    tree.setSummary(new Summary());

    coverageInfo.getFileInfos().forEach(/** @param {FileInfo} fileInfo */ function (fileInfo) {
        var summary = fileInfo.getStatInfo().calcSummary();

        var currentThread = tree;
        var filenameBits = fileInfo.getFilename().split('/');
        var filenamePath = [];
        var filenameBit;

        do {
            if (!currentThread.hasSummary()) {
                currentThread.setSummary(new Summary());
            }
            currentThread.getSummary().add(summary);

            filenameBit = filenameBits.shift();
            if (filenameBit) {
                filenamePath.push(filenameBit);
                if (!currentThread.hasSubNode(filenameBit)) {
                    currentThread.addSubNode(new Node(filenameBit, filenamePath.join('/')));
                }
                currentThread = currentThread.getSubNode(filenameBit);
            }
        } while (filenameBit);
        currentThread.setFileInfo(fileInfo);
        currentThread.setSummary(summary)
    });

    return tree;
};

function Node(name, path) {
    this._name = name;
    this._path = path;
    this._summary = null;
    this._fileInfo = null;
    this._subNodes = {};
}

/**
 * @returns {String}
 */
Node.prototype.getName = function () {
    return this._name;
};

/**
 * @returns {String}
 */
Node.prototype.getPath = function () {
    return this._path;
};

/**
 * @returns {Summary}
 */
Node.prototype.getSummary = function () {
    return this._summary;
};

/**
 * @returns {Boolean}
 */
Node.prototype.hasSummary = function () {
    return Boolean(this._summary);
};

/**
 * @returns {FileInfo}
 */
Node.prototype.getFileInfo = function () {
    return this._fileInfo;
};

/**
 * @param {Summary} summary
 */
Node.prototype.setSummary = function (summary) {
    this._summary = summary;
};

/**
 * @param {FileInfo} fileInfo
 */
Node.prototype.setFileInfo = function (fileInfo) {
    this._fileInfo = fileInfo;
};

/**
 * @returns {Boolean}
 */
Node.prototype.isFile = function () {
    return Boolean(this._fileInfo);
};

/**
 * @returns {Node[]}
 */
Node.prototype.getSubNodes = function () {
    var subNodes = this._subNodes;
    return Object.keys(subNodes).reduce(function (arr, key) {
        arr.push(subNodes[key]);
        return arr;
    }, []);
};

/**
 * @param {String} name
 * @returns {Node|undefined}
 */
Node.prototype.getSubNode = function (name) {
    return this._subNodes[name];
};
/**
 * @param {String} name
 * @returns {Boolean}
 */
Node.prototype.hasSubNode = function (name) {
    return Boolean(this._subNodes[name]);
};

/**
 * @param {Node} node
 */
Node.prototype.addSubNode = function (node) {
    this._subNodes[node.getName()] = node;
};

module.exports.Node = Node;
