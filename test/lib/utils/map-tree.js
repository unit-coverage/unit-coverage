var should = require('chai').should();

var buildTree = require('../../../lib/utils/map-tree').buildTree;
var CoverageInfo = require('../../../lib/obj/coverage-info');
var FileInfo = require('../../../lib/obj/file-info');
var StatInfo = require('../../../lib/obj/stat-info');

describe('map-tree', function () {
    describe('buildTree()', function () {
        it('should build a tree of a single file', function () {
            var tree = buildTree(new CoverageInfo([
                new FileInfo({
                    filename: '1.js'
                })
            ]));

            tree.isFile().should.equal(false);
            should.equal(tree.getPath(), null);
            tree.getSubNodes().length.should.equal(1);
            tree.getSubNodes()[0].isFile().should.equal(true);
            tree.getSubNodes()[0].getPath().should.equal('1.js');
            tree.getSubNodes()[0].getFileInfo().getFilename().should.equal('1.js');
        });

        it('should use directory to unite files', function () {
            var tree = buildTree(new CoverageInfo([
                new FileInfo({
                    filename: 'dir/1.js'
                }),
                new FileInfo({
                    filename: 'dir/2.js'
                })
            ]));

            should.equal(tree.getPath(), null);
            tree.isFile().should.equal(false);
            tree.getSubNodes().length.should.equal(1);
            tree.getSubNodes()[0].isFile().should.equal(false);
            tree.getSubNodes()[0].getPath().should.equal('dir');
            tree.getSubNodes()[0].getSubNodes().length.should.equal(2);
            tree.getSubNodes()[0].getSubNodes()[0].isFile().should.equal(true);
            tree.getSubNodes()[0].getSubNodes()[0].getPath().should.equal('dir/1.js');
            tree.getSubNodes()[0].getSubNodes()[0].getFileInfo().getFilename().should.equal('dir/1.js');
            tree.getSubNodes()[0].getSubNodes()[1].isFile().should.equal(true);
            tree.getSubNodes()[0].getSubNodes()[1].getPath().should.equal('dir/2.js');
            tree.getSubNodes()[0].getSubNodes()[1].getFileInfo().getFilename().should.equal('dir/2.js');
        });
    });
});
