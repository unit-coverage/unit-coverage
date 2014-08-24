var SimpleFileSet = require('./simple-file-set');
var BasenameFileSet = require('./basename-file-set');

module.exports.create = function (name) {
    switch (name) {
        case 'simple':
            return new SimpleFileSet();
        case 'basename':
            return new BasenameFileSet();
    }
};
