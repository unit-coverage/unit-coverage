var EnsureBlocks = require('../../../lib/processors/ensure-blocks');
var Source = require('../../../lib/source');
var SimpleFileSet = require('../../../lib/file-sets/simple-file-set');
var javascript = require('../../../lib/javascript');

describe('EnsureBlocks', function () {
    function processSource(code) {
        var source = new Source(process.cwd(), process.cwd() + '/1.js', code, [], new SimpleFileSet());
        (new EnsureBlocks()).process(source);
        return javascript.generate(source.getAst());
    }

    it('should add braces to "if" statement', function () {
        processSource('if (x) x++; else x--;').should.equal([
            'if (x) {',
            '    x++;',
            '} else {',
            '    x--;',
            '}'
        ].join('\n'));
    });

    it('should add braces to empty "if" statement', function () {
        processSource('if (x);').should.equal([
            'if (x) {',
            '    ;',
            '} else {}'
        ].join('\n'));
    });

    it('should not add braces to "if" statement if not needed', function () {
        processSource('if (x) { x++; } else { x--; }').should.equal([
            'if (x) {',
            '    x++;',
            '} else {',
            '    x--;',
            '}'
        ].join('\n'));
    });

    it('should add braces to "while" statement', function () {
        processSource('while (x) x--;').should.equal([
            'while (x) {',
            '    x--;',
            '}'
        ].join('\n'));
    });

    it('should add braces to "for" statement', function () {
        processSource('for (var i = 0; i < 10; i++) x--;').should.equal([
            'for (var i = 0; i < 10; i++) {',
            '    x--;',
            '}'
        ].join('\n'));
    });

    it('should add braces to "for ... in" statement', function () {
        processSource('for (var i in {a: 1}) x--;').should.equal([
            'for (var i in {',
            '    a: 1',
            '}) {',
            '    x--;',
            '}'
        ].join('\n'));
    });

    it('should add braces to "do ... while" statement', function () {
        processSource('do x--; while (x)').should.equal([
            'do {',
            '    x--;',
            '} while (x);'
        ].join('\n'));
    });

    it('should add braces to "with" statement', function () {
        processSource('with (x) y--;').should.equal([
            'with (x) {',
            '    y--;',
            '}'
        ].join('\n'));
    });

    it('should add braces to arrow function', function () {
        processSource('x = () => 1;').should.equal([
            'x = () => {',
            '    return 1;',
            '};'
        ].join('\n'));
    });
});
