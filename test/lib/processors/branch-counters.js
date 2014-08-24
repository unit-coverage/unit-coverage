var Source = require('../../../lib/source');
var FileSet = require('../../../lib/file-sets/simple-file-set');
var escodegen = require('escodegen');
var BranchCounters = require('../../../lib/processors/branch-counters');
var EnsureBlocks = require('../../../lib/processors/ensure-blocks');

describe('BranchCounters', function () {
    function processSource(code) {
        var source = new Source(process.cwd(), process.cwd() + '/1.js', code, [], new FileSet());
        (new EnsureBlocks()).process(source);
        (new BranchCounters('s')).process(source);
        return {
            code: escodegen.generate(source.getAst()),
            coverageInfo: source.getCoverageInfo()
        };
    }

    it('should place counters to logical expressions', function () {
        var res = processSource([
            'var x = y && z;'
        ].join('\n'));
        var fi = res.coverageInfo.getFileInfo('1.js');
        fi.getBranchIds().should.deep.equal([1]);
        fi.getBranchInfo(1).getId().should.equal(1);
        fi.getBranchInfo(1).getType().should.equal('LogicalExpression');
        fi.getBranchInfo(1).getLocation().should.deep.equal({
            start: {line: 1, column: 8},
            end: {line: 1, column: 14}
        });
        fi.getBranchInfo(1).getThreads().should.deep.equal([
            {
                id: 0,
                location: {
                    start: {line: 1, column: 13},
                    end: {line: 1, column: 14}
                }
            },
            {
                id: 1,
                location: {
                    start: {line: 1, column: 8},
                    end: {line: 1, column: 9}
                }
            }
        ]);
        fi.getStatInfo().getBranchIds().should.deep.equal([1]);
        fi.getStatInfo().getBranchThreadIds(1).should.deep.equal([0, 1]);
        res.code.should.equal([
            'var x = s.countBranch(\'1.js\', 1, 0, 1, y) && z;'
        ].join('\n'));
    });

    it('should place counters to ternary expressions', function () {
        var res = processSource([
            'var x = y ? z : w;'
        ].join('\n'));
        var fi = res.coverageInfo.getFileInfo('1.js');
        fi.getBranchIds().should.deep.equal([1]);
        fi.getBranchInfo(1).getId().should.equal(1);
        fi.getBranchInfo(1).getType().should.equal('ConditionalExpression');
        fi.getBranchInfo(1).getLocation().should.deep.equal({
            start: {line: 1, column: 8},
            end: {line: 1, column: 17}
        });
        fi.getBranchInfo(1).getThreads().should.deep.equal([
            {
                id: 0,
                location: {
                    start: {line: 1, column: 12},
                    end: {line: 1, column: 13}
                }
            },
            {
                id: 1,
                location: {
                    start: {line: 1, column: 16},
                    end: {line: 1, column: 17}
                }
            }
        ]);
        fi.getStatInfo().getBranchIds().should.deep.equal([1]);
        fi.getStatInfo().getBranchThreadIds(1).should.deep.equal([0, 1]);
        res.code.should.equal([
            'var x = s.countBranch(\'1.js\', 1, 0, 1, y) ? z : w;'
        ].join('\n'));
    });

    it('should place counters to if statements', function () {
        var res = processSource([
            'if (x) {',
            '    x++;',
            '} else {',
            '    x--;',
            '}'
        ].join('\n'));
        var fi = res.coverageInfo.getFileInfo('1.js');
        fi.getBranchIds().should.deep.equal([1]);
        fi.getBranchInfo(1).getId().should.equal(1);
        fi.getBranchInfo(1).getType().should.equal('IfStatement');
        fi.getBranchInfo(1).getLocation().should.deep.equal({
            start: {line: 1, column: 0},
            end: {line: 5, column: 1}
        });
        fi.getBranchInfo(1).getThreads().should.deep.equal([
            {
                id: 0,
                location: {
                    start: {line: 1, column: 7},
                    end: {line: 3, column: 1}
                }
            },
            {
                id: 1,
                location: {
                    start: {line: 3, column: 7},
                    end: {line: 5, column: 1}
                }
            }
        ]);
        fi.getStatInfo().getBranchIds().should.deep.equal([1]);
        fi.getStatInfo().getBranchThreadIds(1).should.deep.equal([0, 1]);
        res.code.should.equal([
            'if (x) {',
            '    s.countBranch(\'1.js\', 1, 0);',
            '    x++;',
            '} else {',
            '    s.countBranch(\'1.js\', 1, 1);',
            '    x--;',
            '}'
        ].join('\n'));
    });

    it('should support EnsureBlocks', function () {
        var res = processSource([
            'if (x) x++;'
        ].join('\n'));
        var fi = res.coverageInfo.getFileInfo('1.js');
        fi.getBranchIds().should.deep.equal([1]);
        fi.getBranchInfo(1).getId().should.equal(1);
        fi.getBranchInfo(1).getType().should.equal('IfStatement');
        fi.getBranchInfo(1).getLocation().should.deep.equal({
            start: {line: 1, column: 0},
            end: {line: 1, column: 11}
        });
        fi.getBranchInfo(1).getThreads().should.deep.equal([
            {
                id: 0,
                location: {
                    start: {line: 1, column: 7},
                    end: {line: 1, column: 11}
                }
            },
            {
                id: 1,
                location: {
                    start: {line: 1, column: 11},
                    end: {line: 1, column: 11}
                }
            }
        ]);
        fi.getStatInfo().getBranchIds().should.deep.equal([1]);
        fi.getStatInfo().getBranchThreadIds(1).should.deep.equal([0, 1]);
        res.code.should.equal([
            'if (x) {',
            '    s.countBranch(\'1.js\', 1, 0);',
            '    x++;',
            '} else {',
            '    s.countBranch(\'1.js\', 1, 1);',
            '}'
        ].join('\n'));
    });

    it('should place counters to switch statements', function () {
        var res = processSource([
            'switch (x) {',
            '    case 1:',
            '        x++;',
            '        break;',
            '    case 2:',
            '    case 3:',
            '        x--;',
            '        break;',
            '    default:',
            '        x = 0;',
            '        break;',
            '}'
        ].join('\n'));
        var fi = res.coverageInfo.getFileInfo('1.js');
        fi.getBranchIds().should.deep.equal([1]);
        fi.getBranchInfo(1).getId().should.equal(1);
        fi.getBranchInfo(1).getType().should.equal('SwitchStatement');
        fi.getBranchInfo(1).getLocation().should.deep.equal({
            start: {line: 1, column: 0},
            end: {line: 12, column: 1}
        });
        fi.getBranchInfo(1).getThreads().should.deep.equal([
            {
                id: 0,
                location: {
                    start: {line: 2, column: 4},
                    end: {line: 4, column: 14}
                }
            },
            {
                id: 1,
                location: {
                    start: {line: 5, column: 4},
                    end: {line: 5, column: 11}
                }
            },
            {
                id: 2,
                location: {
                    start: {line: 6, column: 4},
                    end: {line: 8, column: 14}
                }
            },
            {
                id: 3,
                location: {
                    start: {line: 9, column: 4},
                    end: {line: 11, column: 14}
                }
            }
        ]);
        fi.getStatInfo().getBranchIds().should.deep.equal([1]);
        fi.getStatInfo().getBranchThreadIds(1).should.deep.equal([0, 1, 2, 3]);
        res.code.should.equal([
            'switch (x) {',
            'case 1:',
            '    s.countBranch(\'1.js\', 1, 0);',
            '    x++;',
            '    break;',
            'case 2:',
            '    s.countBranch(\'1.js\', 1, 1);',
            'case 3:',
            '    s.countBranch(\'1.js\', 1, 2);',
            '    x--;',
            '    break;',
            'default:',
            '    s.countBranch(\'1.js\', 1, 3);',
            '    x = 0;',
            '    break;',
            '}'
        ].join('\n'));
    });
});
