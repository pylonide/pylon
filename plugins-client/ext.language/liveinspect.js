// this module adds inline variable inspecting + editing to cloud9
define(function(require, exports, module) {

var ide = require("core/ide");
var inspector = require("ext/debugger/inspector");
var ext = require("core/ext");
var markup = require("text!ext/language/liveinspect.xml");
var skin = require("text!ext/language/liveinspect.skin.xml");
// postfix plugin because debugger is restricted keyword
var debuggerPlugin = require("ext/debugger/debugger");
var code = require("ext/code/code");
var Range = require("ace/range").Range;

module.exports = (function () {

    var activeTimeout = null;
    var windowHtml = null;
    var datagridHtml = null;
    var currentExpression = null;
    var marker = null;
    var isOpen = false;

    var hook = function () {
        ext.initExtension(this);

        // listen to changes that affect the debugger, so we can toggle the visibility based on this
        ide.addEventListener("dbg.changeState", checkDebuggerActive);
    };

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

        // when hovering over the inspector window we should ignore all further listeners
        apf.addListener(datagridHtml, "mouseover", function() {
            if (activeTimeout) {
                clearTimeout(activeTimeout);
                activeTimeout = null;
            }
        });

        ide.addEventListener("language.worker", function(e) {
            // listen to the worker's response
            e.worker.on("inspect", function(event) {
                if (!event || !event.data) {
                    return hide();
                }

                // create an expression that the debugger understands
                if (event.data.value) {
                    liveWatch(event.data);
                }
            });
        });

        // bind mouse events to all open editors
        ide.addEventListener("afteropenfile", function (e) {
            var editor = e.doc.$page && e.doc.$page.$editor;

            if (editor && editor.path == "ext/code/code" && editor.amlEditor) {
                var amlEditor = editor.amlEditor;

                amlEditor.$editor.addEventListener("mousemove", onEditorMouseMove);

                // when you click, or change the cursor position, then hide the window
                amlEditor.$editor.addEventListener("mousedown", onEditorClick);
                amlEditor.getSession().getSelection().addEventListener("changeCursor", onEditorClick);
            }
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
            height += (windowHtml.scrollHeight - windowHtml.offsetHeight);

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
            winLiveInspect.$ext.style.height = height + "px";
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
    var checkDebuggerActive = function (dbg) {
        if (dbg.state == 'stopped') {
            // debugger running
        }
        else if (self.winLiveInspect) {
            hide();
        }
    };

    /**
     * Determine whether the current file is the current frame where the
     * debugger is in.
     */
    var isCurrentFrame = function(){
        var frame = self.dbg.activeframe;
        if (!frame)
            return false;

        var page = ide.getActivePage();
        var path = frame.getAttribute("scriptPath");

        // I have to do a fairly weak filename compare.
        // An improvement is to store the full path in the stack model.
        if (page.getModel().queryValue("@path") != path)
            return false;

        // @todo check if we are still in the current function
        // var line = frame.getAttribute("line");
        // var column = frame.getAttribute("column");

        return true;
    }

    /**
     * onMouseMove handler that is being used to show / hide the inline quick watch
     */
    var onEditorMouseMove = function (ev) {
        if (activeTimeout) {
            clearTimeout(activeTimeout);
            activeTimeout = null;
        }

        if (dbg.state == 'stopped') {
            activeTimeout = setTimeout(function () {
                activeTimeout = null;
                if (!isCurrentFrame())
                    return hide();

                var pos = ev.getDocumentPosition();
                if (pos.column == ev.editor.session.getLine(pos.row).length)
                    return hide();

                ide.dispatchEvent("liveinspect", { row: pos.row, col: pos.column });

                // hide it, and set left / top so it gets positioned right when showing again
                if (!marker || !marker.range.contains(pos.row, pos.column)) {
                    hide();
                }
                windowHtml.style.left = ev.clientX + "px";
                windowHtml.style.top = (ev.clientY + 8) + "px";
            }, 450);
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

        var eles = [ code.amlEditor, winLiveInspect ];
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
            if (activeTimeout)
                clearTimeout(activeTimeout);
            activeTimeout = setTimeout(hide, 400);
        }
        else {
            // if not visible? then just clear the timeout
            clearTimeout(activeTimeout);
            activeTimeout = null;
        }
    };

    /**
     * When clicking in the editor window, hide live inspect
     */
    var onEditorClick = function (ev) {
        hide(ev.editor);
    };

    /**
     * Execute live watching
     */
    var liveWatch = function (data) {
        addMarker(data);
        var expr = data.value;
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

    var hide = function () {
        if (winLiveInspect.visible) {
            winLiveInspect.hide();
        }
        if (marker) {
            marker.session.removeMarker(marker.id);
            marker = null;
        }
        if (activeTimeout) {
            activeTimeout = clearTimeout(activeTimeout);
        }
    };

    var addMarker = function (data) {
        var pos = data.pos;
        if (marker) {
            marker.session.removeMarker(marker.id);
        }

        var session = code.amlEditor.$editor.session;
        if (pos.el != pos.sl && data.value.indexOf("\n") == -1) {
            pos.el = pos.sl;
            pos.ec = session.getLine(pos.sl).length;
        }

        var range = new Range(pos.sl, pos.sc, pos.el, pos.ec);
        marker = {
            session: session,
            id: session.addMarker(range, "ace_bracket", "text", true),
            range: range
        };
    };

    var getNumericProperties = function (obj) {
        return Object.keys(obj).filter(function (k) { return !isNaN(k); }).map(function (k) { return obj[k]; });
    };

    // public interfaces
    return ext.register("ext/language/liveinspect", {
        hook    : hook,
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