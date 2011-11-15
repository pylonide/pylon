define(function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');

var handler = module.exports = Object.create(baseLanguageHandler);
var lang = require("ace/lib/lang");

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

var KNOWN_GLOBALS = lang.arrayToMap(["console", "true", "false", "null", "Error", "Array", "Math", "Number", "parseInt", "parseDouble", "JSON", "Object", "isNaN", "setTimeout", "setInterval"]);

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
            'Var(x)', function(b) {
                this.setAnnotation("scope", scope);
                if(!KNOWN_GLOBALS[b.x.value] && !scope[b.x.value]) {
                    markers.push({
                        pos: this.getPos(),
                        type: 'warning',
                        message: 'Undeclared variable'
                    });
                }
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
                    type: 'warning',
                    message: 'Unused variable'
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
    
    function highlightVariable(v) {
        if(!v) return;
        if(v.declaration && v.declaration.getPos())
            markers.push({
                pos: v.declaration.getPos(),
                style: 'border: solid 1px #BFC0C1;'
            });
        v.uses.forEach(function(node) {
            markers.push({
                pos: node.getPos(),
                style: 'border: dotted 1px #BFC0C1;'
            });
        });
    }
    currentNode.rewrite(
        'Var(x)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
        },
        'VarDeclInit(x, _)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
        },
        'VarDecl(x)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
        },
        'FArg(x)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
        }
    );
    return {markers: markers, hint: ""+currentNode};
};
    
});
