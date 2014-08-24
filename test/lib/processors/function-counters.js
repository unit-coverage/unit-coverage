var Source = require('../../../lib/source');
var SimpleFileSet = require('../../../lib/file-sets/simple-file-set');
var escodegen = require('escodegen');
var FunctionCounters = require('../../../lib/processors/function-counters');

describe('FunctionCounters', function () {
    function processSource(code) {
        var source = new Source(process.cwd(), process.cwd() + '/1.js', code, [], new SimpleFileSet());
        (new FunctionCounters('s')).process(source);
        return {
            code: escodegen.generate(source.getAst()),
            coverageInfo: source.getCoverageInfo()
        };
    }

    it('should place counters to function declarations', function () {
        var res = processSource([
            'function f() {',
            '    return 1;',
            '}'
        ].join('\n'));
        var fi = res.coverageInfo.getFileInfo('1.js');
        fi.getFunctionIds().should.deep.equal([1]);
        fi.getFunctionInfo(1).getName().should.equal('f');
        fi.getFunctionInfo(1).getLocation().should.deep.equal({
            start: {line: 1, column: 0},
            end: {line: 3, column: 1}
        });
        fi.getFunctionInfo(1).getId().should.equal(1);
        fi.getStatInfo().getFunctionIds().should.deep.equal([1]);
        res.code.should.equal([
            'function f() {',
            '    s.countFunction(\'1.js\', 1);',
            '    return 1;',
            '}'
        ].join('\n'));
    });
    it('should place counters to function expressions', function () {
        var res = processSource([
            'var f = function() {',
            '    return 1;',
            '};'
        ].join('\n'));
        var fi = res.coverageInfo.getFileInfo('1.js');
        fi.getFunctionIds().should.deep.equal([1]);
        fi.getFunctionInfo(1).getName().should.equal('(anonymous_1)');
        fi.getFunctionInfo(1).getLocation().should.deep.equal({
            start: {line: 1, column: 8},
            end: {line: 3, column: 1}
        });
        fi.getFunctionInfo(1).getId().should.equal(1);
        fi.getStatInfo().getFunctionIds().should.deep.equal([1]);
        res.code.should.equal([
            'var f = function () {',
            '    s.countFunction(\'1.js\', 1);',
            '    return 1;',
            '};'
        ].join('\n'));
    });
    it('should place counters to named function expressions', function () {
        var res = processSource([
            'var f = function x() {',
            '    return 1;',
            '};'
        ].join('\n'));
        var fi = res.coverageInfo.getFileInfo('1.js');
        fi.getFunctionIds().should.deep.equal([1]);
        fi.getFunctionInfo(1).getName().should.equal('x');
        fi.getFunctionInfo(1).getLocation().should.deep.equal({
            start: {line: 1, column: 8},
            end: {line: 3, column: 1}
        });
        fi.getFunctionInfo(1).getId().should.equal(1);
        fi.getStatInfo().getFunctionIds().should.deep.equal([1]);
        res.code.should.equal([
            'var f = function x() {',
            '    s.countFunction(\'1.js\', 1);',
            '    return 1;',
            '};'
        ].join('\n'));
    });
});
