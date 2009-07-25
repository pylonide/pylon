/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

var __CONTENTEDITABLE__  = 1 << 23;

// #ifdef __WITH_CONTENTEDITABLE

apf.ContentEditable = function() {
    this.$regbase = this.$regbase | __CONTENTEDITABLE__;

    var imageHandles = false,
        tableHandles = false,
        activeNode   = null,
        oSel         = null,
        oEditor      = null,
        _self        = this;

    this.$booleanProperties["contenteditable"] = true;
    this.$propHandlers["contenteditable"] = function(value){
        if (apf.isTrue(value))
            attachBehaviors();
        else
            detachBehaviors();
    };

    function createEditor(oNode) {
        if (!oNode || oNode.nodeType != 1) return;
        if (activeNode)
            removeEditor(activeNode);
        activeNode = oNode;
        apf.setStyleClass(oNode, "contentEditable_active", ["contentEditable_over"]);
        
        if (apf.isIE) {
            setTimeout(function() {
                oNode.contentEditable = true;
            });
        }
        else {
            document.designMode = "on";
            if (apf.isGecko) {
                // Tell Gecko (Firefox 1.5+) to enable or not live resizing of objects
                document.execCommand('enableObjectResizing', false, imageHandles);
                // Disable the standard table editing features of Firefox.
                document.execCommand('enableInlineTableEditing', false, tableHandles);
            }
        }
        apf.AbstractEvent.addListener(document, "mousedown", docMouseDown);
        apf.AbstractEvent.addListener(document, "keydown",   docKeyDown);

        oSel = new apf.selection(oEditor || (oEditor = {
            oDoc       : document,
            oWin       : window,
            getViewPort: getViewPort
        }));
    }

    function removeEditor(oNode, bProcess) {
        if (!oNode || oNode.nodeType != 1) return;

        setTimeout(function() {
            activeNode = null;
        });

        apf.setStyleClass(oNode, null, ["contentEditable_over", "contentEditable_active"]);
        apf.AbstractEvent.removeListener(document, "mousedown", docMouseDown);
        apf.AbstractEvent.removeListener(document, "keydown",   docKeyDown);

        if (apf.isIE)
            oNode.contentEditable = false;
        else
            document.designMode = "off";

        if (!bProcess) return;
        // do additional handling
        _self.edit(oNode.getAttribute("xpath"), oNode.innerHTML);

        setTimeout(function() {
            _self.focus();
        });
    }

    function execCommand(name, param) {
        (apf.isIE ? activeNode : document).execCommand(name, false, param);
    }

    function docMouseDown(e) {
        if (!activeNode) return;
        e = e || window.event;
        var el = e.target;
        if (!apf.isChildOf(activeNode, el, true)) {
            removeEditor(activeNode, true); //action confirmed!
            return false;
        }
    }
    
    function docKeyDown(e) {
        if (!activeNode) return;
        e = e || window.event;
        var el   = oSel.getSelectedNode(),
            code = e.which || e.keyCode,
            found;
        if (!apf.isChildOf(activeNode, el, true)) {
            removeEditor(activeNode); //no processing
            var found = false;
            if (apf.isChildOf(_self.oExt, el)) {
                var oNode = el;
                while (!(oNode.className && oNode.className.indexOf("contentEditable") !== -1)
                  && oNode != _self.oExt)
                    oNode = oNode.parentNode;

                if (oNode.className && oNode.className.indexOf("contentEditable") !== -1) {
                    createEditor(oNode);
                    oSel.selectNode(el);
                    found = true;
                }
            }
            if (found)
                return;
            apf.AbstractEvent.stop(e);
            return false;
        }

        if (apf.isIE) {

        }
        else {
            if ((e.ctrlKey || (apf.isMac && e.metaKey)) && !e.shiftKey && !e.altKey) {
                found = false;
                switch (code) {
                    case 66: // B
                    case 98: // b
                        execCommand('Bold');
                        found = true;
                        break;
                    case 105: // i
                    case 73:  // I
                        execCommand('Italic');
                        found = true;
                        break;
                    case 117: // u
                    case 85:  // U
                        execCommand('Underline');
                        found = true;
                        break;
                    case 13: // Enter
                        removeEditor(activeNode, true);
                        break;
                    /*case 86:  // V
                    case 118: // v
                        if (!apf.isGecko)
                            onPaste.call(_self);
                        //found = true;
                        break;
                    case 37: // left
                    case 39: // right
                        found = true;*/
                }
                if (found) {
                    apf.AbstractEvent.stop(e);
                    return false;
                }
            }
        }
    }

    var mouseOver, mouseOut, mouseDown;

    function attachBehaviors() {
        apf.AbstractEvent.addListener(_self.oExt, "mouseover", mouseOver = function(e) {
            var el = e.srcElement || e.target;
            if (el == activeNode) return;
            if (el.className && el.className.indexOf("contentEditable") !== -1) {
                apf.setStyleClass(el, "contentEditable_over");
            }
        });
        apf.AbstractEvent.addListener(_self.oExt, "mouseout",  mouseOut = function(e) {
            var el = e.srcElement || e.target;
            if (el == activeNode) return;
            if (el.className && el.className.indexOf("contentEditable") !== -1) {
                apf.setStyleClass(el, null, ["contentEditable_over"]);
            }
        });
        apf.AbstractEvent.addListener(_self.oExt, "mousedown", mouseDown = function(e) {
            var el = e.srcElement || e.target;
            if (el == activeNode) return; //already in editMode
            if (el.className && el.className.indexOf("contentEditable") !== -1)
                createEditor(el);
            // action confirmed
            else if (activeNode)
                removeEditor(activeNode, true);
        });
    }

    function detachBehaviors() {
        apf.AbstractEvent.removeListener(_self.oExt, "mouseover", mouseOver);
        apf.AbstractEvent.removeListener(_self.oExt, "mouseout",  mouseOut);
        apf.AbstractEvent.removeListener(_self.oExt, "mousedown", mouseDown);
    }

    function getViewPort() {
        var doc = (!window.document.compatMode
          || window.document.compatMode == 'CSS1Compat')
            ? window.document.html || window.document.documentElement //documentElement for an iframe
            : window.document.body;

        // Returns viewport size excluding scrollbars
        return {
            x     : window.pageXOffset || doc.scrollLeft,
            y     : window.pageYOffset || doc.scrollTop,
            width : window.innerWidth  || doc.clientWidth,
            height: window.innerHeight || doc.clientHeight
        };
    }
    
    this.edit = function(xpath, value) {
        this.executeActionByRuleSet("edit", "edit", this.xmlRoot.ownerDocument
            .documentElement.selectSingleNode("//" + xpath), value);
    }

};

// #endif