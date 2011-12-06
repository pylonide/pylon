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
    this.declarations = [];
    if(declaration)
        this.declarations.push(declaration);
    this.uses = [];
}

Variable.prototype.addUse = function(node) {
    this.uses.push(node);
};

Variable.prototype.addDeclaration = function(node) {
    this.declarations.push(node);
};

handler.analyze = function(doc, ast) {
    var markers = [];
    
    // Preclare variables (pre-declares, yo!)
    function preDeclareHoisted(scope, node) {
        node.traverseTopDown(
            // var bla;
            'VarDecl(x)', function(b, node) {
                node.setAnnotation("scope", scope);
                if(!scope.hasOwnProperty(b.x.value))
                    scope[b.x.value] = new Variable(b.x);
                else
                    scope[b.x.value].addDeclaration(b.x);
                return node;
            },
            // var bla = 10;
            'VarDeclInit(x, _)', function(b, node) {
                node.setAnnotation("scope", scope);
                if(!scope.hasOwnProperty(b.x.value))
                    scope[b.x.value] = new Variable(b.x);
                else
                    scope[b.x.value].addDeclaration(b.x);
                return node;
            },
            // function bla(farg) { }
            'Function(x, _, _)', function(b, node) {
                node.setAnnotation("scope", scope);
                if(b.x.value) {
                    scope[b.x.value] = new Variable(b.x);
                }
                return node;
            }
        );
    }
    
    function scopeAnalyzer(scope, node, parentLocalVars) {
        preDeclareHoisted(scope, node);
        var localVariables = parentLocalVars || [];
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
            'ForIn(Var(x), _, _)', function(b, node) {
                if(!scope[b.x.value]) {
                    markers.push({
                        pos: node[0].getPos(),
                        type: 'warning',
                        message: 'Using undeclared variable as iterator variable.'
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
                    localVariables.push(newScope[farg[0].value]);
                });
                scopeAnalyzer(newScope, b.body);
                return node;
            },
            'Catch(x, body)', function(b, node) {
                var oldVar = scope[b.x.value];
                // Temporarily override
                scope[b.x.value] = new Variable(b.x);
                scopeAnalyzer(scope, b.body, localVariables);
                // Put back
                scope[b.x.value] = oldVar;
                return node;
            }
        );
        if(!parentLocalVars) {
            for (var i = 0; i < localVariables.length; i++) {
                if (localVariables[i].uses.length === 0) {
                    var v = localVariables[i];
                    v.declarations.forEach(function(decl) {
                        markers.push({
                            pos: decl.getPos(),
                            type: 'unused',
                            message: 'Unused variable.'
                        });
                    });
                }
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
        v.declarations.forEach(function(decl) {    
            if(decl.getPos())    
                markers.push({
                    pos: decl.getPos(),
                    type: 'occurrence_main'
                });
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
            var scope = this.getAnnotation("scope");
            if (!scope)
                return;
            var v = scope[b.x.value];
            highlightVariable(v);
            // Let's not enable renaming 'this' and only rename declared variables
            if(b.x.value !== "this" && v)
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
            // Only for named functions
            if(!b.x.value)
                return;
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
    var mainNode;    
    currentNode.rewrite(
        'VarDeclInit(x, _)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = b.x;    
        },
        'VarDecl(x)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = b.x;
        },
        'FArg(x)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = node;
        },
        'Function(x, _, _)', function(b, node) {
            if(!b.x.value)
                return;
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = b.x;
        },
        'Var(x)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = node;
        }
    );
    var pos = mainNode.getPos();
    var others = [];

    var length = pos.ec - pos.sc;

    v.declarations.forEach(function(node) {
         if(node !== currentNode[0]) {
            var pos = node.getPos();
            others.push({column: pos.sc, row: pos.sl});
        }
    });
    
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
