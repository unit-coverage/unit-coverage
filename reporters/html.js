var mapTree = require('../lib/utils/map-tree');
var chalk = require('chalk');
var fs = require('fs');
var esprima = require('esprima');
var entities = new (require('html-entities').XmlEntities)();
var escope = require('escope');
var estraverse = require('estraverse');
var jade = require('jade');

module.exports = function (map) {
    var tree = mapTree.buildTree(map);

    placeLevels(tree);

    function placeLevels(tree) {
        if (tree.lines) {
            tree.level = Math.round(tree.coveredLines * 100 / tree.lines);
            tree.status = tree.level > 80 ? 'high' : (tree.level > 30 ? 'medium' : 'low');
            tree.level += '%';
            if (tree.isFile) {
                map[tree.path].level = tree.level;
                map[tree.path].status = tree.status;
            }
        }
        Object.keys(tree.nodes).forEach(function (key) {
            placeLevels(tree.nodes[key]);
        });
    }

    var files = Object.keys(map).map(function (filename) {
        var fileInfo = map[filename];
        var content = fs.readFileSync(filename, 'utf8');
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
                if (node.type === 'MemberExpression') {
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
                var value = token.value + '';
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
        var codeLines = html.split('\n').map(function (code, i) {
            var lineNumber = i + 1;
            var state = 'no-state';
            if (typeof fileInfo.lines[lineNumber] !== 'undefined') {
                state = fileInfo.lines[lineNumber] > 0 ? 'covered' : 'uncovered'
            }
            return {
                code: code,
                number: lineNumber,
                state: state
            };
        });
        return {
            filename: filename,
            name: filename.split('/').pop(),
            lines: codeLines
        };
    });
    console.log(jade.renderFile(__dirname + '/html/template.jade', {
        files: files,
        tree: tree
    }))
};

