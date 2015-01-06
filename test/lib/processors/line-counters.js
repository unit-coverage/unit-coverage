var should = require('chai').should();

var Source = require('../../../lib/source');
var SimpleFileSet = require('../../../lib/file-sets/simple-file-set');
var escodegen = require('escodegen');
var LineCounters = require('../../../lib/processors/line-counters');

describe('LineCounters', function () {
    function processSource(code) {
        var source = new Source(process.cwd(), process.cwd() + '/1.js', code, [], new SimpleFileSet());
        (new LineCounters('s')).process(source);
        return {
            code: escodegen.generate(source.getAst()),
            coverageInfo: source.getCoverageInfo()
        };
    }

    it('should not count on excluded files', function () {
        var source = new Source(
            process.cwd(), process.cwd() + '/excluded.js', 'var x = 1;', ['excluded.js'], new SimpleFileSet()
        );
        (new LineCounters('s')).process(source);
        should.not.exist(source.getCoverageInfo().getFileInfo('excluded.js'));
    });
    it('should place counters to program root', function () {
        var res = processSource([
            'var x = 1;',
            'x++;'
        ].join('\n'));
        var fi = res.coverageInfo.getFileInfo('1.js');
        fi.getStatInfo().getLineNumbers().should.deep.equal([1, 2]);
        res.code.should.equal([
            's.countLine(\'1.js\', 1);',
            'var x = 1;',
            's.countLine(\'1.js\', 2);',
            'x++;'
        ].join('\n'));
    });
    it('should place counters to function bodies', function () {
        var res = processSource([
            'function f() {',
            '    var x = 1;',
            '    x++;',
            '}'
        ].join('\n'));
        var fi = res.coverageInfo.getFileInfo('1.js');
        fi.getStatInfo().getLineNumbers().should.deep.equal([1, 2, 3]);
        res.code.should.equal([
            's.countLine(\'1.js\', 1);',
            'function f() {',
            '    s.countLine(\'1.js\', 2);',
            '    var x = 1;',
            '    s.countLine(\'1.js\', 3);',
            '    x++;',
            '}'
        ].join('\n'));
    });
    it('should place counters to switch cases', function () {
        var res = processSource([
            'switch (val) {',
            '    case 1:',
            '        val++;',
            '        break;',
            '    case 2:',
            '        break;',
            '}'
        ].join('\n'));
        var fi = res.coverageInfo.getFileInfo('1.js');
        fi.getStatInfo().getLineNumbers().should.deep.equal([1, 3, 4, 6]);
        res.code.should.equal([
            's.countLine(\'1.js\', 1);',
            'switch (val) {',
            'case 1:',
            '    s.countLine(\'1.js\', 3);',
            '    val++;',
            '    s.countLine(\'1.js\', 4);',
            '    break;',
            'case 2:',
            '    s.countLine(\'1.js\', 6);',
            '    break;',
            '}'
        ].join('\n'));
    });
});
