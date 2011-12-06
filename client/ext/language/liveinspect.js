// this module adds inline variable inspecting + editing to cloud9
define(function(require, exports, module) {

var ide = require("core/ide");
var inspector = require("ext/debugger/inspector");
var ext = require("core/ext");
var markup = require("text!ext/language/liveinspect.xml");
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
    
    var hook = function(_ext, worker) {
        ext.initExtension(this);
        
        // listen to the worker's response
        worker.on("inspect", function(event) {
            if (!event || !event.data) {
                winLiveInspect.hide();
                return;
            }
            
            // create an expression that the debugger understands
            var expression = event.data;
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
        
        /*
         * This has been commented out because this functionality is still
         * open for debate. We'll fix this in iteration 2.
         *
        // yes, this is superhacky but the editor function in APF is crazy        
        datagridHtml.addEventListener("dblclick", initializeEditor);
        */
        
        // when collapsing or expanding the datagrid we want to resize
        dgLiveInspect.addEventListener("expand", resizeWindow);
        dgLiveInspect.addEventListener("collapse", resizeWindow);
    };
    
    var resizeWindow = function () {
        var gridRows = datagridHtml.querySelectorAll(".row");
        // iterate over all properties
        var rows = Object.keys(gridRows)
            .filter(function (r) { return !isNaN(r); }) // filter non numeric properties
            .map(function (r) { return gridRows[r]; }) // map them into real objects
            .filter(function (r) { return r.offsetHeight > 0; }); // check whether they are visible
        
        // if we have any rows
        if (rows && rows.length) {
            // determine height based on first one
            var height = rows[0].offsetHeight * rows.length;
            
            // add border of the container
            height += (windowHtml.offsetHeight - windowHtml.scrollHeight);
            
            // find header
            var header = datagridHtml.querySelector(".headings");
            if (header) {
                height += header.offsetHeight;
            }
            
            // we don't want this to fall of the screen
            var maxHeight = (window.innerHeight - winLiveInspect.$ext.offsetTop) - 30;
            if (height > maxHeight) {
                height = maxHeight;
            }
            
            // update height
            winLiveInspect.setAttribute("height", height);
        }
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
              
            // check whether we are able to edit this item
            if (!inspector.isEditable(dgLiveInspect.selected)) {
                return;
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
                if (!inspector.validateNewValue(dgLiveInspect.selected, this.value)) {
                    alert("invalid value for type " + dgLiveInspect.selected.getAttribute("type"));
                    return false;
                }
                
                // remove the texteditor
                this.parentNode.removeChild(this);
                
                // restore the label
                target.style.display = originalDisplay;
                target.innerText = this.value;
                
                inspector.setNewValue(dgLiveInspect.selected, this.value, function (res) { });
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
            
            // clean UI to remove selected elements
            dgLiveInspect.selected = null; 
            dgLiveInspect.selection = []; 
            dgLiveInspect.sellength = 0;
            
            // store it
            currentExpression = expr;        
                        
            // show window
            winLiveInspect.show();
            
            // resize the window
            resizeWindow();
        });
    };
    
    var getNumericProperties = function (obj) {
        return Object.keys(obj).filter(function (k) { return !isNaN(k); }).map(function (k) { return obj[k]; });
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