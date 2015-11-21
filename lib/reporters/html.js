var mapTree = require('../utils/map-tree');
var fs = require('fs');
var path = require('path');
var javascript = require('../javascript');
var entities = new (require('html-entities').XmlEntities)();
// var escope = require('escope');
var jade = require('jade');
var babylon = require('babylon');
var tt = babylon.tokTypes;

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
                            var preLine = token.loc.start.line;
                            result.push({
                                type: 'Rest',
                                sourceCode: sourceCode.substr(token.start - col, col),
                                start: token.start - col,
                                end: token.start,
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
                        result.push({
                            type: 'Rest',
                            sourceCode: sourceCode.substring(token.start, token.start + strLen),
                            start: token.start,
                            end: token.start + strLen,
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
    var ast = javascript.parse(content);
    var source = ast.tokens.concat();
    source.sort(function (a, b) {
        return a.start - b.start;
    });
    source = source.map(function (token) {
        token.sourceCode = content.slice(token.start, token.end);
        return token;
    });

    var codeTokens = [];
    var prevPos = 0;
    var prevLocEnd = {line: 1, column: 0};
    var endLoc = {
        line: source.length,
        column: source[source.length - 1].length
    };

    source.forEach(function (token, i) {
        if (token.start !== prevPos) {
            var nextToken = source[i + 1];
            codeTokens.push({
                type: 'Whitespace',
                sourceCode: content.substring(prevPos, token.start),
                start: prevPos,
                end: token.start,
                loc: {start: prevLocEnd, end: nextToken ? nextToken.loc.start : endLoc}
            });
        }
        codeTokens.push(token);
        prevPos = token.end;
        prevLocEnd = token.loc.end;
    });
    if (prevPos < content.length) {
        codeTokens.push({
            type: 'Whitespace',
            sourceCode: content.substring(prevPos, content.length),
            start: prevPos,
            end: content.length,
            loc: {start: prevLocEnd, end: endLoc}
        });
    }

    /*
        FIXME: escope
        var tokenIndex = {};
        codeTokens.forEach(function (token) {
            tokenIndex[token.start] = token;
        });
        var scopeManager = escope.analyze(ast);
        var variables = collectVariables(scopeManager.acquire(ast.program));

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
                tokenIndex[ident.start].type = varType;
            });
        });

        javascript.traverse(ast, {
            enter: function (context) {
                var node = context.node;
                if (node.type === 'MemberExpression' && !node.computed) {
                    if (node.property.type === 'Identifier') {
                        tokenIndex[node.property.start].type = 'Field';
                    }
                }
                if (node.type === 'ObjectExpression') {
                    node.properties.forEach(function (prop) {
                        tokenIndex[prop.key.start].type = 'Field';
                    });
                }
            }
        });
    */

    return {html: tokensToHtml(codeTokens), tokens: codeTokens};
}

function tokensToHtml(codeTokens) {
    var html = '';
    codeTokens.forEach(function (token) {
        if (token.type === 'Whitespace') {
            html += token.sourceCode;
        } else {
            var sourceCode = String(token.sourceCode);
            processToken(token);
            if (token.type === 'Punctuator' && ('()[]{}').indexOf(sourceCode) !== -1) {
                token.type = 'Brace';
            }
            if (token.type === 'Punctuator' && sourceCode === '.') {
                token.type = 'Dot';
            }
            var tagOpen = '<span class="' + token.type + '">';
            var tagClose = '</span>';
            html += tagOpen +
                entities.encode(sourceCode).replace(/\n/g, tagClose + '\n' + tagOpen) +
                tagClose;
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

function processToken(token) {
    var type = token.type;

    if (type === tt.name) {
        token.type = 'Identifier';
    } else if (type === tt.semi || type === tt.comma ||
        type === tt.parenL || type === tt.parenR ||
        type === tt.braceL || type === tt.braceR ||
        type === tt.slash || type === tt.dot ||
        type === tt.bracketL || type === tt.bracketR ||
        type === tt.ellipsis || type === tt.arrow ||
        type === tt.star || type === tt.incDec ||
        type === tt.colon || type === tt.question ||
        type === tt.backQuote ||
        type === tt.dollarBraceL || type === tt.at ||
        type === tt.logicalOR || type === tt.logicalAND ||
        type === tt.bitwiseOR || type === tt.bitwiseXOR ||
        type === tt.bitwiseAND || type === tt.equality ||
        type === tt.relational || type === tt.bitShift ||
        type === tt.plusMin || type === tt.modulo ||
        type === tt.exponent || type === tt.prefix ||
        type === tt.doubleColon ||
        type.isAssign) {
        token.type = 'Punctuator';
    } else if (type === tt.template) {
        token.type = 'Template';
    } else if (type === tt.jsxTagStart) {
        token.type = 'Punctuator';
    } else if (type === tt.jsxTagEnd) {
        token.type = 'Punctuator';
    } else if (type === tt.jsxName) {
        token.type = 'JSXIdentifier';
    } else if (type === tt.jsxText) {
        token.type = 'JSXText';
    } else if (type.keyword === 'null') {
        token.type = 'Null';
    } else if (type.keyword === 'false' || type.keyword === 'true') {
        token.type = 'Boolean';
    } else if (type.keyword) {
        token.type = 'Keyword';
    } else if (type === tt.num) {
        token.type = 'Numeric';
    } else if (type === tt.string) {
        token.type = 'String';
    } else if (type === tt.regexp) {
        token.type = 'RegularExpression';
    } else if (type === tt.eof) {
        token.type = 'EOF';
    }

    return token;
}
