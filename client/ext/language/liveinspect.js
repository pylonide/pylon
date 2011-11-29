// this module adds inline variable inspecting + editing to cloud9
define(function(require, exports, module) {

var ide = require("core/ide");
var inspector = require("ext/debugger/inspector");
var markup = require("text!ext/language/liveinspect.xml");
var ext = require("core/ext");
var skin = require("text!ext/language/liveinspect.skin.xml");

module.exports = (function () {
    
    var activeTimeout = null;
    var windowHtml = null;
    var datagridHtml = null;
    var currentExpression = null;
    
    var init = function () {
        // get respective HTML elements
        windowHtml = winLiveInspect.$ext;
        datagridHtml = dgLiveInspect.$ext;
    };
    
    var hook = function(whoa, worker) {
        ext.initExtension(this);
        
        // listen to the worker's response
        worker.on("inspect", function(event) {
            if (!event || !event.data) {
                winLiveInspect.hide();
                return;
            }
            
            // create an expression that the debugger understands
            var expression = getExpressionValue(event.data);
            if (expression) {
                liveWatch(expression);
            }
        });
        
        // bind mous events to all open editors
        ide.addEventListener("afteropenfile", function (e) {
            if (e.editor && e.editor.ceEditor) {
                e.editor.ceEditor.$editor.addEventListener("mousemove", onEditorMouseMove);
                e.editor.ceEditor.$editor.addEventListener("mousedown", onEditorClick);
            }
        });
        
        // listen to changes that affect the debugger, so we can toggle the visibility based on this
        stRunning.addEventListener("prop.active", checkDebuggerActive);
        stDebugProcessRunning.addEventListener("prop.active", checkDebuggerActive);
        
        // when hovering over the inspector window we should ignore all further listeners
        datagridHtml.addEventListener("mouseover", function () {
            if (activeTimeout) {
                clearTimeout(activeTimeout);
            }
        });
        
        // yes, this is superhacky but the editor function in APF is crazy
        datagridHtml.addEventListener("dblclick", initializeEditor);
    };
        
    /**
     * WARNING this is a piece of junk
     * Initialize an editor in the place of the 'value' field when doubleclicking
     */
    var initializeEditor = function (ev) {
        // get the real clicked element
        var target = ev.target;
        
        // only interested in the node with index 1
        if (target.tagName === "U" /* its in an <u> */
          && target.parentNode.parentNode.childNodes[1] === target.parentNode /* [1] index */
          && !target.parentNode.hid /* and no header */) {
              
            // grab the type
            var type = target.parentNode.parentNode.childNodes[2];
            // regex validator to make sure we don't mess up
            var validator = null;
              
            switch ((type.innerText || "").trim()) {
                case "string":
                case "null":
                    validator = /.+/;
                    break;
                case "number":
                    validator = /^\d+(\.\d+)?$/;
                    break;
                case "boolean":
                    validator = /^(true|false)$/;
                    break;
                default:
                    return; // other types cannot be edited
            }
            
            // V8 debugger cannot change variables that are locally scoped, so we need at least 
            // one parent property.
            if (inspector.calcName(dgLiveInspect.selected, true).indexOf('.') === -1) {
                return;
            }
            
            // get current display property
            var originalDisplay = target.style.display;
            
            // create new simple input field
            var edit = document.createElement("input");
            edit.type = "text";
            edit.value = target.innerText;
            edit.style.width = "100%";
            
            // update variable
            var onBlur = function () {
                // remove to stop further prop
                edit.removeEventListener("blur", onBlur);
                
                // test for correct value
                if (!validator.test(this.value)) {
                    alert("invalid value for type " + type.innerText);
                    return false;
                }
                
                // remove the texteditor
                this.parentNode.removeChild(this);
                
                // restore the label
                target.style.display = originalDisplay;
                target.innerText = this.value;
                
                // find the prop plus its ancestors
                var expression = inspector.calcName(dgLiveInspect.selected, true);
                  
                // build an instruction for the compiler
                var instruction;
                switch ((type.innerText || "").trim()) {
                    case "string":
                    case "null":
                        // escape strings
                        instruction = expression + " = \"" + this.value.replace(/"/g, "\\\"") + "\"";
                        break;
                    default:
                        instruction = expression + " = " + this.value;
                        break;
                }
                
                // dispatch it to the debugger
                inspector.evaluate(instruction, function () {
                    // todo: do something fancy with the result
                });
            };
            
            // when blurring, update
            edit.addEventListener("blur", onBlur);
            
            // on keydown, same same
            edit.addEventListener("keydown", function (ev) {
                if (ev.keyCode === 27 || ev.keyCode === 13) { // tab or enter
                    return onBlur.call(this);
                }
                if (ev.keyCode === 32) {  // somewhere in APF the space is captured; no clue why
                    this.value += " "; // this is super lame, but better than nothing
                }
                return true;
            });
            
            // now hide the cur value
            target.style.display = "none";
            // and append textbox
            target.parentNode.appendChild(edit);
        }
    };
    
    /**
     * Check whether the debugger is attached & on a breakpoint
     */
    var checkDebuggerActive = function () {
        if (!stRunning.active && stDebugProcessRunning.active) {
            // debugger running
        }
        else {
            winLiveInspect.hide();
        }
    };
    
    /**
     * onMouseMove handler that is being used to show / hide the inline quick watch
     */
    var onEditorMouseMove = function (ev) {
        if (activeTimeout) clearTimeout(activeTimeout);
        
        if (!stRunning.active && stDebugProcessRunning.active) {
            activeTimeout = setTimeout(function () {
                var pos = ev.getDocumentPosition();
                ide.dispatchEvent("liveinspect", { row: pos.row, col: pos.column });
                
                // hide it, and set left / top so it gets positioned right when showing again
                winLiveInspect.hide();
                windowHtml.style.left = ev.pageX + "px";
                windowHtml.style.top = (ev.pageY + 8) + "px";
            }, 400);
        }
    };
    
    /**
     * When clicking in the editor window, hide live inspect
     */
    var onEditorClick = function (ev) {
        winLiveInspect.hide();
    };
    
    /**
     * Execute live watching
     */
    var liveWatch = function (expr) {
        // already visible, and same expression?
        if (winLiveInspect.visible === 1 && expr === currentExpression) {
            return;
        }
        
        // if there is any modal window open, then don't show
        var windows = getNumericProperties(document.querySelectorAll(".winadv") || {}).filter(function (w) {
            return w.style.display !== "none";
        });
        if (windows.length) {
            return;
        }
        
        // if context menu open, then also disable
        if (mnuCtxEditor && mnuCtxEditor.visible) {
            return;
        }
        
        // evaluate the expression in the debugger, and receive model as callback
        inspector.evaluate(expr, function (model) {
            // bind it to the datagrid
            var root  = apf.getXml("<data />");
            apf.xmldb.appendChild(root, model);
            dgLiveInspect.getModel().load(root);
            
            // store it
            currentExpression = expr;
            
            // show window
            winLiveInspect.show();
        });
    };
    
    /*** These should go into a different module probably ***/
    
    // variable declaration
    var expVarDeclInit = function (d) {
        return d[0].value;
    };
    
    // variable calling
    var expVar = function (d) {
        return d[0].value;
    };
    
    // property access
    var expPropAccess = function (d) {        
        // find all numeric keys
        // map them thru getValue
        // join em with a little dot
        return getNumericProperties(d)
            .map(function (m) { return getExpressionValue(m); })
            .join(".");
    };
    
    // method call
    var expCall = function (d) {
        var method = getExpressionValue(d[0]);
        var args = getNumericProperties(d[1])
                    .map(function (k) { return getExpressionValue(k); })
                    .join(", ");
                    
        return method + "(" + args + ")";
    };
    
    // numeric f.e. used in index [1]
    var expNum = function (d) {
        return d[0].value;
    };
    
    // index calling
    var expIndex = function (d) {
        return getExpressionValue(d[0]) + "[" + getExpressionValue(d[1]) + "]";
    };
    
    // new X()
    var expNew = function (d) {
        return "new "
                + getExpressionValue(d[0])
                + "("
                + getNumericProperties(d[1]).map(function (arg) { return arg.value; }).join(", ")
                + ")";
    };
    
    // function parameter
    var expFarg = function (d) {
        return d[0].value;
    };
    
    var getNumericProperties = function (obj) {
        return Object.keys(obj).filter(function (k) { return !isNaN(k); }).map(function (k) { return obj[k]; });
    };
    
    // get a string value of any expression
    var getExpressionValue = function(d) {
        if (d.value) return d.value;
        
        switch (d.cons) {
            case "VarDeclInit":
                return expVarDeclInit(d);
            case "PropAccess":
                return expPropAccess(d);
            case "Var":
                return expVar(d);
            case "Call":
                return expCall(d);
            case "Num":
                return expNum(d);
            case "Index":
                return expIndex(d);
            case "New":
                return expNew(d);
            case "FArg":
                return expFarg(d);
        }
    };
    
    // public interfaces
    return {
        init    : init,
        hook    : hook,
        name    : "Live inspect",
        dev     : "Ajax.org",
        type    : ext.GENERAL,
        alone   : true,
        markup  : markup,
        skin    : skin
    };
} ());

});