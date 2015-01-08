var mapTree = require('../utils/map-tree');
var fs = require('fs');
var path = require('path');
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
        var hl = highlightJS(sourceCode);
        var html = hl.html;
        var tokens = hl.tokens;

        var stat = fileInfo.getStatInfo();

        var codeLines = html.split('\n').map(function (code, i) {
            var lineNumber = i + 1;
            var state = 'no-state';

            var callCount = stat.getLineCallCount(lineNumber);

            if (typeof callCount !== 'undefined') {
                state = callCount > 0 ? 'covered' : 'uncovered';
            }

            return {
                info: [],
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

                line.info.push({
                    title: 'Function ' + functionInfo.getName(),
                    branches: [{
                        covered: covered,
                        title: covered ? 'Was called' : 'Was not called',
                        html: shortenHtml(tokensToHtml(getFragment(functionInfo.getLocation())))
                    }]
                });
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
            var branches = [];
            var branchType = branchInfo.getType();
            branchInfo.getThreads().forEach(function (thread) {
                var covered = stat.getBranchThreadCallCount(branchId, thread.id) > 0;
                var title = covered ? 'Was evaluated' : 'Was not evaluated';

                switch (branchType) {
                    case 'LogicalExpression':
                        title = covered ? 'Was returned' : 'Was not returned';
                        break;
                    case 'ConditionalExpression':
                        if (thread.id === 0) {
                            title = covered ? 'Positive was returned (? ...)' : 'Positive was not returned (? ...)';
                        } else if (thread.id === 1) {
                            title = covered ? 'Negative was returned (: ...)' : 'Negative was not returned (: ...)';
                        }
                        break;
                    case 'IfStatement':
                        if (thread.id === 0) {
                            title = covered ? 'Positive was executed (if)' : 'Positive was not executed (if)';
                        } else if (thread.id === 1) {
                            title = covered ? 'Negative was executed (else)' : 'Negative was not executed (else)';
                        }
                        break;
                }

                branches.push({
                    covered: covered,
                    title: title,
                    html: shortenHtml(tokensToHtml(getFragment(thread.location)))
                });
            });
            line.info.push({
                title: 'Branch ' + branchInfo.getType(),
                branches: branches
            });
        });

        function getFragment(loc) {
            var start = loc.start;
            var end = loc.end;
            var started = false;
            var result = [];
            for (var i = 0; i < tokens.length; i++) {
                var token = tokens[i];
                if (!started) {
                    if (token.loc.start.line >= start.line && token.loc.start.column >= start.column) {
                        var col = token.loc.start.column;
                        if (col > 0) {
                            var preRange = [token.range[0] - col, token.range[0]];
                            var preLine = token.loc.start.line;
                            result.push({
                                type: 'Rest',
                                value: sourceCode.substr(preRange[0], col),
                                range: preRange,
                                loc: {
                                    start: {
                                        line: preLine,
                                        column: 0
                                    },
                                    end: {
                                        line: preLine,
                                        column: col
                                    }
                                }
                            });
                        }
                        result.push(token);
                        started = true;
                    }
                } else {
                    if (
                        token.loc.start.line > end.line ||
                        (token.loc.start.line === end.line && token.loc.start.column >= end.column)
                    ) {
                        var postLine = token.loc.start.line;
                        var strLen = (sourceCodeLines[postLine - 1] || '').length - token.loc.start.column;
                        var postRange = [token.range[0], token.range[0] + strLen];
                        result.push({
                            type: 'Rest',
                            value: sourceCode.substring(postRange[0], postRange[1]),
                            range: postRange,
                            loc: {
                                start: {
                                    line: postLine,
                                    column: token.loc.start.column
                                },
                                end: {
                                    line: postLine,
                                    column: token.loc.start.column + strLen
                                }
                            }
                        });

                        return result;
                    } else {
                        result.push(token);
                    }
                }
            }
            return result;
        }

        return {
            filename: fileInfo.getFilename(),
            name: path.basename(fileInfo.getFilename()),
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
    var ast = esprima.parse(content, {tokens: true, comment: true, range: true, loc: true});
    var source = ast.tokens.concat(ast.comments);
    source.sort(function (a, b) {
        return a.range[0] - b.range[0];
    });
    var codeTokens = [];
    var prevPos = 0;
    var prevLocEnd = {line: 1, column: 0};
    var endLoc = {
        line: source.length,
        column: source[source.length - 1].length
    };

    source.forEach(function (token, i) {
        if (token.range[0] !== prevPos) {
            var nextToken = source[i + 1];
            codeTokens.push({
                type: 'Whitespace',
                value: content.substring(prevPos, token.range[0]),
                range: [prevPos, token.range[0]],
                loc: {start: prevLocEnd, end: nextToken ? nextToken.loc.start : endLoc}
            });
        }
        codeTokens.push(token);
        prevPos = token.range[1];
        prevLocEnd = token.loc.end;
    });
    if (prevPos < content.length) {
        codeTokens.push({
            type: 'Whitespace',
            value: content.substring(prevPos, content.length),
            range: [prevPos, content.length],
            loc: {start: prevLocEnd, end: endLoc}
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

    return {html: tokensToHtml(codeTokens), tokens: codeTokens};
}

function tokensToHtml(codeTokens) {
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

function shortenHtml(html) {
    var lines = html.split('\n');
    var firstLine = lines.shift();
    if (lines.length > 0) {
        return (
            '<span class="short">' + firstLine +
                '<span class="short-more">&middot;&middot;&middot;</span>' +
                '<span class="short-more-content">' +
                    '<br/>' +
                    lines.join('<br/>') +
                '</span>' +
            '</span>'
        );
    } else {
        return firstLine.trim();
    }
}
