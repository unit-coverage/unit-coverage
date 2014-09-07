var mapTree = require('../utils/map-tree');
var fs = require('fs');
var esprima = require('esprima');
var entities = new (require('html-entities').XmlEntities)();
var escope = require('escope');
var estraverse = require('estraverse');
var jade = require('jade');

/**
 * @param {CoverageInfo} coverageInfo
 */
module.exports = function (coverageInfo) {
    var tree = mapTree.buildTree(coverageInfo);

    var files = coverageInfo.getFileInfos().map(function (fileInfo) {
        var sourceCode = fs.readFileSync(fileInfo.getFilename(), 'utf8');
        var sourceCodeLines = sourceCode.split('\n');
        var html = highlightJS(sourceCode);

        var stat = fileInfo.getStatInfo();

        var codeLines = html.split('\n').map(function (code, i) {
            var lineNumber = i + 1;
            var state = 'no-state';

            var callCount = stat.getLineCallCount(lineNumber);

            if (typeof callCount !== 'undefined') {
                state = callCount > 0 ? 'covered' : 'uncovered';
            }

            return {
                marks: '',
                code: code,
                initialCode: sourceCodeLines[i],
                number: lineNumber,
                state: state
            };
        });

        function updateCoverageStatus(lineNumber, covered) {
            var line = codeLines[lineNumber - 1];
            if (line.state === 'no-state') {
                line.state = covered ? 'covered' : 'uncovered';
            } else {
                if (
                    (covered && line.state === 'uncovered') ||
                    (!covered && line.state === 'covered')
                ) {
                    line.state = 'semi-covered';
                }
            }
        }

        function generateMarkRegion(startLine, location, className) {
            var result = '';
            var markedRegionStarted = false;
            var markedRegionFinished = false;
            var start = location.start;
            var end = location.end;
            for (var lineNumber = startLine; lineNumber <= location.end.line; lineNumber++) {
                var lineLen = codeLines[lineNumber - 1].initialCode.length;
                for (var i = 0; i < lineLen; i++) {
                    if (markedRegionStarted) {
                        if (lineNumber === end.line && i === end.column) {
                            markedRegionFinished = true;
                            result += '</span>';
                        }
                    } else {
                        if (lineNumber === start.line && i === start.column) {
                            markedRegionStarted = true;
                            result += '<span class="' + className + '">';
                        }
                        if (lineNumber === end.line && i === end.column) {
                            markedRegionFinished = true;
                            result += '</span>';
                        }
                    }
                    result += ' ';
                }
                if (markedRegionStarted) {
                    if (lineNumber === end.line && i === end.column) {
                        markedRegionFinished = true;
                        result += '</span>';
                    }
                }
                result += '\n';
            }
            if (markedRegionStarted && !markedRegionFinished) {
                result += '</span>';
            }

            return '<span class="line-mark">' + result + '</span>';
        }

        fileInfo.getFunctionIds().forEach(function (functionId) {
            var functionInfo = fileInfo.getFunctionInfo(functionId);
            var callCount = stat.getFunctionCallCount(functionId);
            if (callCount !== undefined) {
                var start = functionInfo.getLocation().start;
                var startLine = start.line;
                var covered = callCount > 0;
                updateCoverageStatus(
                    startLine,
                    covered
                );
                var line = codeLines[startLine - 1];
                line.marks += generateMarkRegion(
                    startLine,
                    {start: start, end: {line: start.line, column: start.column + 8}},
                    covered ? 'covered' : 'uncovered'
                );
            }
        });

        fileInfo.getBranchIds().forEach(function (branchId) {
            var branchInfo = fileInfo.getBranchInfo(branchId);
            var start = branchInfo.getLocation().start;
            var startLine = start.line;
            updateCoverageStatus(
                startLine,
                branchInfo.getThreads().every(function (thread) {
                    return stat.getBranchThreadCallCount(branchId, thread.id) > 0;
                })
            );
            var line = codeLines[startLine - 1];
            branchInfo.getThreads().forEach(function (thread) {
                line.marks += generateMarkRegion(
                    startLine,
                    thread.location,
                    stat.getBranchThreadCallCount(branchId, thread.id) > 0 ? 'covered' : 'uncovered'
                );
            });
        });

        return {
            filename: fileInfo.getFilename(),
            name: fileInfo.getFilename().split('/').pop(),
            lines: codeLines
        };
    });

    return jade.renderFile(__dirname + '/html/template.jade', {
        files: files,
        tree: tree
    });
};

function highlightJS(content) {
    content = content.replace(/^#!/, '//');
    var ast = esprima.parse(content, {tokens: true, comment: true, range: true});
    var source = ast.tokens.concat(ast.comments);
    source.sort(function (a, b) {
        return a.range[0] - b.range[0];
    });
    var codeTokens = [];
    var prevPos = 0;
    source.forEach(function (token) {
        if (token.range[0] !== prevPos) {
            codeTokens.push({
                type: 'Whitespace',
                value: content.substring(prevPos, token.range[0]),
                range: [prevPos, token.range[0]]
            });
        }
        codeTokens.push(token);
        prevPos = token.range[1];
    });
    if (prevPos < content.length) {
        codeTokens.push({
            type: 'Whitespace',
            value: content.substring(prevPos, content.length),
            range: [prevPos, content.length]
        });
    }
    var tokenIndex = {};
    codeTokens.forEach(function (token) {
        tokenIndex[token.range[0]] = token;
    });
    var scopeManager = escope.analyze(ast);
    var variables = collectVariables(scopeManager.acquire(ast));

    function collectVariables(scope) {
        return [].concat.apply(
            scope.variables,
            scope.childScopes.map(collectVariables)
        );
    }

    variables.forEach(function (variable) {
        var nodes = variable.references.map(function (ref) {
            return ref.identifier;
        }).concat(variable.identifiers);
        var varType = 'ImplicitGlobalVariable';
        variable.defs.forEach(function (def) {
            varType = def.type;
        });
        nodes.forEach(function (ident) {
            tokenIndex[ident.range[0]].type = varType;
        });
    });

    estraverse.traverse(ast, {
        enter: function (node) {
            if (node.type === 'MemberExpression' && !node.computed) {
                if (node.property.type === 'Identifier') {
                    tokenIndex[node.property.range[0]].type = 'Field';
                }
            }
            if (node.type === 'ObjectExpression') {
                node.properties.forEach(function (prop) {
                    tokenIndex[prop.key.range[0]].type = 'Field';
                });
            }
        }
    });

    var html = '';
    codeTokens.forEach(function (token) {
        if (token.type === 'Whitespace') {
            html += token.value;
        } else {
            var value = String(token.value);
            if (token.type === 'Block') {
                value = '/*' + value + '*/';
            }
            if (token.type === 'Punctuator' && ('()[]{}').indexOf(value) !== -1) {
                token.type = 'Brace';
            }
            if (token.type === 'Punctuator' && value === '.') {
                token.type = 'Dot';
            }
            if (token.type === 'Line') {
                value = '//' + value;
            }
            var tagOpen = '<span class="' + token.type + '">';
            var tagClose = '</span>';
            html += tagOpen + entities.encode(value).replace(/\n/g, tagClose + '\n' + tagOpen) + tagClose;
        }
    });

    return html;
}
