// this module adds inline variable inspecting + editing to cloud9
define(function(require, exports, module) {

var ide = require("core/ide");
var inspector = require("ext/debugger/inspector");
var ext = require("core/ext");
var markup = require("text!ext/language/liveinspect.xml");
var skin = require("text!ext/language/liveinspect.skin.xml");
// postfix plugin because debugger is restricted keyword
var debuggerPlugin = require("ext/debugger/debugger"); 

module.exports = (function () {
    
    var activeTimeout = null;
    var windowHtml = null;
    var datagridHtml = null;
    var currentExpression = null;
    
    var init = function () {
        // get respective HTML elements
        windowHtml = winLiveInspect.$ext;
        datagridHtml = dgLiveInspect.$ext;
        winLiveInspect.addEventListener("prop.visible", function(e) {
            // don't track when hiding the window
            if (!e.value)
                return;
            ide.dispatchEvent("track_action", {
                type: "live inspect code",
                expression: currentExpression || "no expression available yet."
            });
        });
        
        ide.addEventListener("language.worker", function(e){
            // listen to the worker's response
            e.worker.on("inspect", function(event) {
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
        });
        
        // bind mous events to all open editors
        ide.addEventListener("afteropenfile", function (e) {
            if (e.editor && e.editor.ceEditor) {
                var editor = e.editor.ceEditor;
                
                editor.$editor.addEventListener("mousemove", onEditorMouseMove);
                
                // when you click, or change the cursor position, then hide the window
                editor.$editor.addEventListener("mousedown", onEditorClick);
                editor.getSession().getSelection().addEventListener("changeCursor", onEditorClick);
            }
        });
        
        ide.addEventListener("init.ext/debugger/debugger", function(){
            // listen to changes that affect the debugger, so we can toggle the visibility based on this
            stRunning.addEventListener("prop.active", checkDebuggerActive);
            stDebugProcessRunning.addEventListener("prop.active", checkDebuggerActive);
            
            // when hovering over the inspector window we should ignore all further listeners
            apf.addListener(datagridHtml, "mouseover", function() {
                if (activeTimeout) {
                    clearTimeout(activeTimeout);
                }
            });
        });
        
        // we should track mouse movement over the whole window
        apf.addListener(document, "mousemove", onDocumentMouseMove);
        
        // yes, this is superhacky but the editor function in APF is crazy
        apf.addListener(datagridHtml, "dblclick", initializeEditor);
        
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
              
            // bug in APF? When having only 1 item the 'selected' property isnt set properly
            var selected = dgLiveInspect.selected;
            if (!selected && dgLiveInspect.getModel().data.childNodes.length === 1) {
                // because you just doubleclicked an item, well just grab the only one
                selected = dgLiveInspect.getModel().data.childNodes[0]; 
            }
              
            // check whether we are able to edit this item
            if (!inspector.isEditable(selected)) {
                return;
            }
            
            // V8 debugger cannot change variables that are locally scoped, so we need at least 
            // one parent property.
            if (inspector.calcName(selected, true).indexOf('.') === -1) {
                return;
            }
            
            // get current display property
            var originalDisplay = target.style.display;
            
            // create new simple input field
            var edit = document.createElement("input");
            edit.type = "text";
            edit.value = target.innerText;
            edit.style.width = "98%";
            edit.style.outline = "0";
            edit.style.border = "solid 1px gray";
            edit.style.height = "13px";
            edit.style["margin-top"] = "1px";
            
            // update variable
            var onBlur = function () {
                // remove to stop further prop
                edit.removeEventListener("blur", onBlur);
                
                // test for correct value
                if (!inspector.validateNewValue(selected, this.value)) {
                    alert("invalid value for type " + selected.getAttribute("type"));
                    return false;
                }
                
                // remove the texteditor
                this.parentNode.removeChild(this);
                
                // restore the label
                target.style.display = originalDisplay;
                target.innerText = this.value;
                
                inspector.setNewValue(selected, this.value, function (res) { });
            };
            
            // when blurring, update
            apf.addListener(edit, "blur", onBlur);
            
            // on keydown, same same
            apf.addListener(edit, "keydown", function(ev) {
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
            
            // focus
            edit.focus();
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
        if (activeTimeout) {
            clearTimeout(activeTimeout);   
        }
        
        if (!stRunning.active && stDebugProcessRunning.active) {
            activeTimeout = setTimeout(function () {
                var pos = ev.getDocumentPosition();
                ide.dispatchEvent("liveinspect", { row: pos.row, col: pos.column });
                
                // hide it, and set left / top so it gets positioned right when showing again
                winLiveInspect.hide();
                windowHtml.style.left = ev.pageX + "px";
                windowHtml.style.top = (ev.pageY + 8) + "px";
            }, 750);
        }
    };
    
    /**
     * onDocumentMove handler to clear the timeout
     */
    var onDocumentMouseMove = function (ev) {
        if (!activeTimeout) {
            return;   
        }
        
        // see whether we hover over the editor or the quickwatch window
        var mouseMoveAllowed = false;
        
        var eles = [ ceEditor, winLiveInspect ];
        // only the visible ones
        eles.filter(function (ele) { return ele.visible; })
            .map(function (ele) { return ele.$ext; }) // then get the HTML counterpart
            .forEach(function (ele) {
                // then detect real position
                var position = apf.getAbsolutePosition(ele, document.body);
                var left = position[0];
                var top = position[1];
                
                // x boundaries
                if (ev.pageX >= left && ev.pageX <= (left + ele.offsetWidth)) {
                    // y boundaries
                    if (ev.pageY >= top && ev.pageY <= (top + ele.offsetHeight)) {
                        // we are in the editor, so return; this will be handled
                        mouseMoveAllowed = true;
                    }
                }            
            });
        
        if (mouseMoveAllowed) return;
                
        // not in the editor?
        if (winLiveInspect.visible) {
            // if we are visible, then give the user 400 ms to get back into the window
            // otherwise hide it
            activeTimeout = setTimeout(function () {
                winLiveInspect.hide();
            }, 750);
        }
        else {
            // if not visible? then just clear the timeout
            clearTimeout(activeTimeout);
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
        if (winLiveInspect.visible && expr === currentExpression) {
            return;
        }
        
        // if there is any modal window open, then don't show
        var windows = getNumericProperties(document.querySelectorAll(".winadv") || {}).filter(function (w) {
            return w.style.display !== "none" && w.style.visibility !== "hidden";
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
    return ext.register("ext/language/liveinspect", {
        init    : init,
        name    : "Live inspect",
        dev     : "Ajax.org",
        type    : ext.GENERAL,
        alone   : true,
        markup  : markup,
        deps    : [ debuggerPlugin ],
        skin    : {
            id   : "inlinedg",
            data : skin
        }
    });
} ());

});