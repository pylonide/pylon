/**
 * JavaScript scope analysis module and warning reporter.
 * 
 * This handler does a couple of things:
 * 1. It does scope analysis and attaches a scope object to every variable, variable declartion and function declaration
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
var lang = require("ace/lib/lang");

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

var KNOWN_GLOBALS = lang.arrayToMap(["console", "window", "true", "false", "null", "undefined", "Worker", 
                                     "Infinity", "Error", "Array", "Math", "Number", "parseInt",
                                     "parseDouble", "JSON", "Object", "isNaN", "setTimeout", "setInterval"]);
function Variable(declaration) {
    this.declaration = declaration;
    this.uses = [];
}

Variable.prototype.addUse = function(node) {
    this.uses.push(node);
};

handler.analyze = function(doc, ast) {
    var markers = [];
    
    // Preclare, more like
    function preDeclareHoisted(scope, node) {
        node.traverseTopDown(
            'VarDecl(x)', function(b) {
                this.setAnnotation("scope", scope);
                scope[b.x.value] = new Variable(b.x);
            },
            'VarDeclInit(x, _)', function(b) {
                this.setAnnotation("scope", scope);
                scope[b.x.value] = new Variable(b.x);
            },
            'Function(x, _, _)', function(b) {
                this.setAnnotation("scope", scope);
                if(b.x.value) {
                    scope[b.x.value] = new Variable(b.x);
                }
                return this;
            },
            'Catch(_, _, _)', function(b) {
                return this;
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
            'Assign(Var(x), _)', function(b) {
                if(!scope[b.x.value])
                    markers.push({
                        pos: this[0].getPos(),
                        type: 'warning',
                        message: 'Assigning to undeclared variable.'
                    });
            },
            'Var(x)', function(b) {
                this.setAnnotation("scope", scope);
                if(scope[b.x.value]) {
                    scope[b.x.value].addUse(this);
                }
                return this;
            },
            'Function(x, fargs, body)', function(b) {
                var newScope = Object.create(scope);
                newScope['this'] = new Variable();
                b.fargs.forEach(function(farg) {
                    farg.setAnnotation("scope", newScope);
                    newScope[farg[0].value] = new Variable(farg);
                });
                scopeAnalyzer(newScope, b.body);
                return this;
            },
            'Catch(x, body)', function(b) {
                var newScope = Object.create(scope);
                newScope[b.x.value] = new Variable(b.x);
                scopeAnalyzer(newScope, b.body);
                return this;
            }
        );
        for (var i = 0; i < localVariables.length; i++) {
            if(localVariables[i].uses.length === 0) {
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
    if(!currentNode) return;
    var markers = [];
    var enableRefactorings = [];
    
    function highlightVariable(v) {
        if(!v) return;
        if(v.declaration && v.declaration.getPos())
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
        }
    );
    return {markers: markers, enableRefactorings: enableRefactorings}; //, hint: ""+currentNode};
};

handler.getVariablePositions = function(doc, fullAst, cursorPos, currentNode) {
    var v;
    currentNode.rewrite(
        'VarDeclInit(x, _)', function(b) {
            v = this.getAnnotation("scope")[b.x.value];
        },
        'VarDecl(x)', function(b) {
            v = this.getAnnotation("scope")[b.x.value];
        },
        'FArg(x)', function(b) {
            v = this.getAnnotation("scope")[b.x.value];
        }
    );
    var pos = v.declaration.getPos();
    var length = pos.ec - pos.sc;
    
    var others = [];
    v.uses.forEach(function(node) {
        var pos = node.getPos();
        others.push({column: pos.sc, row: pos.sl});
    });
    return {length: length, pos: {row: pos.sl, column: pos.sc}, others: others};
};

});
