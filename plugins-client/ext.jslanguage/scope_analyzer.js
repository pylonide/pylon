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

// Based on https://github.com/jshint/jshint/blob/master/jshint.js#L331
var GLOBALS = {
    // Literals
    "true"                   : true,
    "false"                  : true,
    "undefined"              : true,
    "null"                   : true,
    "this"                   : true,
    "arguments"              : true,
    // Browser
    ArrayBuffer              :  true,
    ArrayBufferView          :  true,
    Audio                    :  true,
    addEventListener         :  true,
    applicationCache         :  true,
    blur                     :  true,
    clearInterval            :  true,
    clearTimeout             :  true,
    close                    :  true,
    closed                   :  true,
    DataView                 :  true,
    defaultStatus            :  true,
    document                 :  true,
    event                    :  true,
    FileReader               :  true,
    Float32Array             :  true,
    Float64Array             :  true,
    FormData                 :  true,
    getComputedStyle         :  true,
    HTMLElement              :  true,
    HTMLAnchorElement        :  true,
    HTMLBaseElement          :  true,
    HTMLBlockquoteElement    :  true,
    HTMLBodyElement          :  true,
    HTMLBRElement            :  true,
    HTMLButtonElement        :  true,
    HTMLCanvasElement        :  true,
    HTMLDirectoryElement     :  true,
    HTMLDivElement           :  true,
    HTMLDListElement         :  true,
    HTMLFieldSetElement      :  true,
    HTMLFontElement          :  true,
    HTMLFormElement          :  true,
    HTMLFrameElement         :  true,
    HTMLFrameSetElement      :  true,
    HTMLHeadElement          :  true,
    HTMLHeadingElement       :  true,
    HTMLHRElement            :  true,
    HTMLHtmlElement          :  true,
    HTMLIFrameElement        :  true,
    HTMLImageElement         :  true,
    HTMLInputElement         :  true,
    HTMLIsIndexElement       :  true,
    HTMLLabelElement         :  true,
    HTMLLayerElement         :  true,
    HTMLLegendElement        :  true,
    HTMLLIElement            :  true,
    HTMLLinkElement          :  true,
    HTMLMapElement           :  true,
    HTMLMenuElement          :  true,
    HTMLMetaElement          :  true,
    HTMLModElement           :  true,
    HTMLObjectElement        :  true,
    HTMLOListElement         :  true,
    HTMLOptGroupElement      :  true,
    HTMLOptionElement        :  true,
    HTMLParagraphElement     :  true,
    HTMLParamElement         :  true,
    HTMLPreElement           :  true,
    HTMLQuoteElement         :  true,
    HTMLScriptElement        :  true,
    HTMLSelectElement        :  true,
    HTMLStyleElement         :  true,
    HTMLTableCaptionElement  :  true,
    HTMLTableCellElement     :  true,
    HTMLTableColElement      :  true,
    HTMLTableElement         :  true,
    HTMLTableRowElement      :  true,
    HTMLTableSectionElement  :  true,
    HTMLTextAreaElement      :  true,
    HTMLTitleElement         :  true,
    HTMLUListElement         :  true,
    HTMLVideoElement         :  true,
    Int16Array               :  true,
    Int32Array               :  true,
    Int8Array                :  true,
    Image                    :  true,
    localStorage             :  true,
    location                 :  true,
    navigator                :  true,
    open                     :  true,
    openDatabase             :  true,
    Option                   :  true,
    parent                   :  true,
    print                    :  true,
    removeEventListener      :  true,
    resizeBy                 :  true,
    resizeTo                 :  true,
    screen                   :  true,
    scroll                   :  true,
    scrollBy                 :  true,
    scrollTo                 :  true,
    sessionStorage           :  true,
    setInterval              :  true,
    setTimeout               :  true,
    SharedWorker             :  true,
    Uint16Array              :  true,
    Uint32Array              :  true,
    Uint8Array               :  true,
    WebSocket                :  true,
    window                   :  true,
    Worker                   :  true,
    XMLHttpRequest           :  true,
    XPathEvaluator           :  true,
    XPathException           :  true,
    XPathExpression          :  true,
    XPathNamespace           :  true,
    XPathNSResolver          :  true,
    XPathResult              :  true,
    // Devel
    alert                    : true,
    confirm                  : true,
    console                  : true,
    Debug                    : true,
    opera                    : true,
    prompt                   : true,
    // Frameworks
    jQuery                   : true,
    "$"                      : true,
    "$$"                     : true,
    goog                     : true,
    dojo                     : true,
    dojox                    : true,
    dijit                    : true,
    apf                      : true,
    // mootools
    Assets                   : true,
    Browser                  : true,
    Chain                    : true,
    Class                    : true,
    Color                    : true,
    Cookie                   : true,
    Core                     : true,
    Document                 : true,
    DomReady                 : true,
    DOMReady                 : true,
    Drag                     : true,
    Element                  : true,
    Elements                 : true,
    Event                    : true,
    Events                   : true,
    Fx                       : true,
    Group                    : true,
    Hash                     : true,
    HtmlTable                : true,
    Iframe                   : true,
    IframeShim               : true,
    InputValidator           : true,
    instanceOf               : true,
    Keyboard                 : true,
    Locale                   : true,
    Mask                     : true,
    MooTools                 : true,
    Native                   : true,
    Options                  : true,
    OverText                 : true,
    Request                  : true,
    Scroller                 : true,
    Slick                    : true,
    Slider                   : true,
    Sortables                : true,
    Spinner                  : true,
    Swiff                    : true,
    Tips                     : true,
    Type                     : true,
    typeOf                   : true,
    URI                      : true,
    Window                   : true,
    // prototype.js
    '$A'                     : true,
    '$F'                     : true,
    '$H'                     : true,
    '$R'                     : true,
    '$break'                 : true,
    '$continue'              : true,
    '$w'                     : true,
    Abstract                 : true,
    Ajax                     : true,
    Enumerable               : true,
    Field                    : true,
    Form                     : true,
    Insertion                : true,
    ObjectRange              : true,
    PeriodicalExecuter       : true,
    Position                 : true,
    Prototype                : true,
    Selector                 : true,
    Template                 : true,
    Toggle                   : true,
    Try                      : true,
    Autocompleter            : true,
    Builder                  : true,
    Control                  : true,
    Draggable                : true,
    Draggables               : true,
    Droppables               : true,
    Effect                   : true,
    Sortable                 : true,
    SortableObserver         : true,
    Sound                    : true,
    Scriptaculous            : true,
    // require.js
    define                   : true,
    // node.js
    __filename               : true,
    __dirname                : true,
    Buffer                   : true,
    exports                  : true,
    GLOBAL                   : true,
    global                   : true,
    module                   : true,
    process                  : true,
    require                  : true,
    // Standard
    Array                    : true,
    Boolean                  : true,
    Date                     : true,
    decodeURI                : true,
    decodeURIComponent       : true,
    encodeURI                : true,
    encodeURIComponent       : true,
    Error                    : true,
    'eval'                   : true,
    EvalError                : true,
    Function                 : true,
    hasOwnProperty           : true,
    isFinite                 : true,
    isNaN                    : true,
    JSON                     : true,
    Math                     : true,
    Number                   : true,
    Object                   : true,
    parseInt                 : true,
    parseFloat               : true,
    RangeError               : true,
    ReferenceError           : true,
    RegExp                   : true,
    String                   : true,
    SyntaxError              : true,
    TypeError                : true,
    URIError                 : true,
    // non-standard
    escape                   : true,
    unescape                 : true
};

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
    var handler = this;
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
        function analyze(scope, node) {
            node.traverseTopDown(
                'VarDecl(x)', function(b) {
                    localVariables.push(scope[b.x.value]);
                },
                'VarDeclInit(x, _)', function(b) {
                    localVariables.push(scope[b.x.value]);
                },
                'Assign(Var(x), e)', function(b, node) {
                    if(!scope[b.x.value]) {
                        markers.push({
                            pos: node[0].getPos(),
                            type: 'warning',
                            message: 'Assigning to undeclared variable.'
                        });
                    }
                    else {
                        scope[b.x.value].addUse(node);
                    }
                    analyze(scope, b.e);
                    return this;
                },
                'ForIn(Var(x), e, stats)', function(b, node) {
                    if(!scope[b.x.value]) {
                        markers.push({
                            pos: node[0].getPos(),
                            type: 'warning',
                            message: 'Using undeclared variable as iterator variable.'
                        });
                    }
                    else {
                        scope[b.x.value].addUse(node);
                    }
                    analyze(scope, b.e);
                    analyze(scope, b.stats);
                    return this;
                },
                'Var(x)', function(b, node) {
                    node.setAnnotation("scope", scope);
                    if(scope[b.x.value]) {
                        scope[b.x.value].addUse(node);
                    } else if(handler.isFeatureEnabled("undeclaredVars") && !GLOBALS[b.x.value]) {
                        markers.push({
                            pos: this.getPos(),
                            type: 'warning',
                            message: "Undeclared variable."
                        });
                    }
                    return node;
                },
                'Function(x, fargs, body)', function(b, node) {
                    node.setAnnotation("scope", scope);

                    var newScope = Object.create(scope);
                    newScope['this'] = new Variable();
                    b.fargs.forEach(function(farg) {
                        farg.setAnnotation("scope", newScope);
                        newScope[farg[0].value] = new Variable(farg);
                        if (handler.isFeatureEnabled("unusedFunctionArgs"))
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
                },
                'PropAccess(_, "lenght")', function(b, node) {
                    markers.push({
                        pos: node.getPos(),
                        type: 'warning',
                        message: "Did you mean 'length'?"
                    });
                },
                'Call(Var("parseInt"), [_])', function() {
                    markers.push({
                        pos: this[0].getPos(),
                        type: 'warning',
                        message: "Missing radix argument."
                    });
                }
            );
        }
        analyze(scope, node);
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
