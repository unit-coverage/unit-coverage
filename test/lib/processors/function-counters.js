var should = require('chai').should();

var Source = require('../../../lib/source');
var SimpleFileSet = require('../../../lib/file-sets/simple-file-set');
var escodegen = require('escodegen');
var FunctionCounters = require('../../../lib/processors/function-counters');

var File = require('enb-source-map/lib/file');

describe('FunctionCounters', function () {
    function processSource(code) {
        var source = new Source(process.cwd(), process.cwd() + '/1.js', code, [], new SimpleFileSet());
        (new FunctionCounters('s')).process(source);
        return {
            code: escodegen.generate(source.getAst()),
            coverageInfo: source.getCoverageInfo()
        };
    }

    it('should not count on excluded files', function () {
        var source = new Source(
            process.cwd(), process.cwd() + '/excluded.js',
            'function t() { return 1; };',
            ['excluded.js'], new SimpleFileSet()
        );
        (new FunctionCounters('s')).process(source);
        should.not.exist(source.getCoverageInfo().getFileInfo('excluded.js'));
    });
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

    it('should correctly handle source maps', function () {
        var file = new File('1.js', true);
        file.writeContent('// Hello World');
        file.writeContent('// Some unmapped content');
        file.writeFileContent(
            'func1.js',
            '// anonymous function here\n' +
            'var f1 = function() {\n' +
            '    return 1;\n' +
            '};\n' +
            '// end of anonymous function\n'
        );
        file.writeFileContent(
            'func2.js',
            '// named function here\n' +
            '    function f1() {\n' +
            '        return 1;\n' +
            '    }\n' +
            '// end of named function\n'
        );
        var res = processSource(file.render());
        /** @type {CoverageInfo} */
        var ci = res.coverageInfo;

        var file1 = ci.getFileInfo('func1.js');
        file1.getFunctionIds().length.should.equal(1);
        var f1 = file1.getFunctionInfo(file1.getFunctionIds()[0]);

        f1.getName().should.equal('(anonymous_1)');
        f1.getLocation().start.line.should.equal(2);
        f1.getLocation().start.column.should.equal(9);
        f1.getLocation().end.line.should.equal(4);
    });
});
