/**
 * JavaScript scope analysis module and warning reporter.
 * 
 * This handler does a couple of things:
 * 1. It does scope analysis and attaches a scope object to every variable, variable declaration and function declaration
 * 2. It creates markers for undeclared variables
 * 3. It creates markers for unused variables
 * 4. It implements the local variable refactoring
 * 
 * @depend ext/jslanguage/parse
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');
require('treehugger/traverse');
var handler = module.exports = Object.create(baseLanguageHandler);

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

function Variable(declaration) {
    this.declaration = declaration;
    this.uses = [];
}

Variable.prototype.addUse = function(node) {
    this.uses.push(node);
};

handler.analyze = function(doc, ast) {
    var markers = [];
    
    // Preclare variables (pre-declares, yo!)
    function preDeclareHoisted(scope, node) {
        node.traverseTopDown(
            // var bla;
            'VarDecl(x)', function(b, node) {
                node.setAnnotation("scope", scope);
                scope[b.x.value] = new Variable(b.x);
                return node;
            },
            // var bla = 10;
            'VarDeclInit(x, _)', function(b, node) {
                node.setAnnotation("scope", scope);
                scope[b.x.value] = new Variable(b.x);
                return node;
            },
            // function bla(farg) { }
            'Function(x, _, _)', function(b, node) {
                node.setAnnotation("scope", scope);
                if(b.x.value) {
                    scope[b.x.value] = new Variable(b.x);
                }
                return node;
            },
            // catch(e) { ... }
            'Catch(_, _, _)', function(b, node) {
                return node;
            }
        );
    }
    
    function scopeAnalyzer(scope, node) {
        preDeclareHoisted(scope, node);
        var localVariables = [];
        node.traverseTopDown(
            'VarDecl(x)', function(b) {
                localVariables.push(scope[b.x.value]);
            },
            'VarDeclInit(x, _)', function(b) {
                localVariables.push(scope[b.x.value]);
            },
            'Assign(Var(x), _)', function(b, node) {
                if(!scope[b.x.value]) {
                    markers.push({
                        pos: node[0].getPos(),
                        type: 'warning',
                        message: 'Assigning to undeclared variable.'
                    });
                }
            },
            'Var(x)', function(b, node) {
                node.setAnnotation("scope", scope);
                if(scope[b.x.value]) {
                    scope[b.x.value].addUse(node);
                }
                return node;
            },
            'Function(x, fargs, body)', function(b, node) {
                var newScope = Object.create(scope);
                newScope['this'] = new Variable();
                b.fargs.forEach(function(farg) {
                    farg.setAnnotation("scope", newScope);
                    newScope[farg[0].value] = new Variable(farg);
                });
                scopeAnalyzer(newScope, b.body);
                return node;
            },
            'Catch(x, body)', function(b, node) {
                var newScope = Object.create(scope);
                newScope[b.x.value] = new Variable(b.x);
                scopeAnalyzer(newScope, b.body);
                return node;
            }
        );
        for (var i = 0; i < localVariables.length; i++) {
            if (localVariables[i].uses.length === 0) {
                var v = localVariables[i];
                markers.push({
                    pos: v.declaration.getPos(),
                    type: 'unused',
                    message: 'Unused variable.'
                });
            }
        }
    }
    scopeAnalyzer({}, ast);
    return markers;
};

handler.onCursorMovedNode = function(doc, fullAst, cursorPos, currentNode) {
    if (!currentNode)
        return;
    var markers = [];
    var enableRefactorings = [];
    
    function highlightVariable(v) {
        if (!v)
            return;
        if (v.declaration && v.declaration.getPos())
            markers.push({
                pos: v.declaration.getPos(),
                type: 'occurrence_main'
            });
        v.uses.forEach(function(node) {
            markers.push({
                pos: node.getPos(),
                type: 'occurrence_other'
            });
        });
    }
    currentNode.rewrite(
        'Var(x)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
            // Let's not enable renaming 'this'
            if(b.x.value !== "this")
                enableRefactorings.push("renameVariable");
        },
        'VarDeclInit(x, _)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
            enableRefactorings.push("renameVariable");
        },
        'VarDecl(x)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
            enableRefactorings.push("renameVariable");
        },
        'FArg(x)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
            enableRefactorings.push("renameVariable");
        },
        'Function(x, _, _)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
            enableRefactorings.push("renameVariable");
        }
    );
    
    if (!this.isFeatureEnabled("instanceHighlight"))
        return { enableRefactorings: enableRefactorings };    

    return {
        markers: markers,
        enableRefactorings: enableRefactorings
    };
};

handler.getVariablePositions = function(doc, fullAst, cursorPos, currentNode) {
    var v;
    var isDecl = false;
    currentNode.rewrite(
        'VarDeclInit(x, _)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            isDecl = true;
        },
        'VarDecl(x)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            isDecl = true;
        },
        'FArg(x)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            isDecl = true;
        },
        'Function(x, _, _)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            isDecl = true;
        },
        'Var(x)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
        }
    );
    var pos;
    var others = [];
    if(isDecl)
        pos = v.declaration.getPos();
    else {
        pos = currentNode.getPos();
        var otherPos = v.declaration.getPos();
        others.push({column: otherPos.sc, row: otherPos.sl});
    }
    var length = pos.ec - pos.sc;
    
    v.uses.forEach(function(node) {
        if(node !== currentNode) {
            var pos = node.getPos();
            others.push({column: pos.sc, row: pos.sl});
        }
    });
    return {
        length: length,
        pos: {
            row: pos.sl,
            column: pos.sc
        },
        others: others
    };
};

});
