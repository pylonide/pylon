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

    var objectHandles = false,
        tableHandles  = false,
        lastPos       = 0,
        activeNode    = null,
        tabStack      = null,
        oSel          = null,
        _self         = this;

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
            //setTimeout(function() {
                oNode.contentEditable = true;
            //});
        }
        else {
            document.designMode = "on";
            if (apf.isGecko) {
                // On each return, insert a BR element
                document.execCommand("insertBrOnReturn", false, true);
                // Tell Gecko (Firefox 1.5+) to enable or not live resizing of objects
                document.execCommand("enableObjectResizing", false, objectHandles);
                // Disable the standard table editing features of Firefox.
                document.execCommand("enableInlineTableEditing", false, tableHandles);
            }
        }

        //#ifdef __WITH_WINDOW_FOCUS
        if (apf.hasFocusBug) {
            apf.sanitizeTextbox(oNode);
            oNode.onselectstart = function(e) {
                e = e || window.event;
                e.cancelBubble = true;
            };
        }
        //#endif

        apf.AbstractEvent.addListener(document, "mousedown", docMouseDown);
        apf.AbstractEvent.addListener(document, "keydown",   docKeyDown);

        oSel = new apf.selection(window, document);
        oSel.cache();
    }

    function removeEditor(oNode, bProcess, callback) {
        if (!oNode || oNode.nodeType != 1) return;
        oSel.collapse(true);

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
        // do additional handling, first we check for a change in the data...
        var xpath = oNode.getAttribute("xpath");
        if (apf.queryValue(_self.xmlRoot.ownerDocument, xpath) != oNode.innerHTML) {
            _self.edit(xpath, oNode.innerHTML);
            tabStack = null; // redraw of editable region, invalidate cache
        }
        if (!callback) return;
        setTimeout(function() {
            callback();
        });
    }

    function execCommand(name, param) {
        oSel.cache();
        (apf.isIE ? activeNode : document).execCommand(name, false, param);
    }

    function docMouseDown(e) {
        if (!activeNode) return;
        e = e || window.event;
        oSel.cache();
        var el = e.srcElement || e.target;
        if (!apf.isChildOf(activeNode, el, true)) {
            removeEditor(activeNode, true); //action confirmed!
            return false;
        }
    }
    
    function docKeyDown(e) {
        if (!activeNode) return;
        e = e || window.event;
        oSel.cache();
        var el   = oSel.getSelectedNode(),
            code = e.which || e.keyCode,
            found;
//debugger;
        if (!apf.isIE && !apf.isChildOf(activeNode, el, true)) {
            // #ifdef __DEBUG
            apf.console.log('ContentEditable - keyDown: no child of mine');
            // #endif
            var callback = null;
            if (apf.isChildOf(_self.oExt, el)) {
                // #ifdef __DEBUG
                apf.console.log('ContentEditable - keyDown: el IS a child of mine');
                // #endif
                while (el.parentNode && !(el.className && el != _self.oExt
                  && el.className.indexOf("contentEditable") !== -1))
                    el = el.parentNode;

                if (el.className && el.className.indexOf("contentEditable") !== -1) {
                    callback = function() {
                        createEditor(el);
                        oSel.selectNode(el.lastChild);
                    }
                }
            }
            removeEditor(activeNode, false, callback); //no processing
            if (callback) {
                // most common case this happens: user navigated out of
                // contentEditable area with the arrow keys
                window.blur();
                return;
            }
            apf.AbstractEvent.stop(e);
            return false;
        }

        if (apf.isIE) {
            if (code == 8 && oSel.getType() == "Control") {
                oSel.remove();
                found = true;
            }
        }
        else {
            if ((e.ctrlKey || (apf.isMac && e.metaKey)) && !e.shiftKey && !e.altKey) {
                found = false;
                switch (code) {
                    case 66: // B
                    case 98: // b
                        execCommand("Bold");
                        found = true;
                        break;
                    case 105: // i
                    case 73:  // I
                        execCommand("Italic");
                        found = true;
                        break;
                    case 117: // u
                    case 85:  // U
                        execCommand("Underline");
                        found = true;
                        break;
                    case 13: // Enter
                        removeEditor(activeNode, true);
                        found = true;
                        break;
                }
            }
        }
        // Tab navigation handling
        if (code == 9 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            var bShift = e.shiftKey,
                oNode  = bShift ? getTabPrev(activeNode) : getTabNext(activeNode);
            if (oNode) {
                // a callback is passed, because the call is a-sync
                removeEditor(activeNode, true, function() {
                    // re-fetch, because data may been reloaded
                    oNode = bShift ? getTabPrev(activeNode) : getTabNext(activeNode);
                    createEditor(oNode);
                    oSel.selectNode(oNode.firstChild);
                });
            }
            found = true;
        }
        // Esc key handling
        else if (code == 27 && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
            removeEditor(activeNode, true);
            found = true;
        }

        if (found) {
            apf.AbstractEvent.stop(e);
            return false;
        }

        document.onkeydown(e);
    }

    function initTabStack() {
        tabStack = [];
        var aNodes = _self.oExt.getElementsByTagName("*");
        for (var i = 0, l = aNodes.length; i < l && aNodes[i].nodeType == 1; i++) {
            if (aNodes[i].className
              && aNodes[i].className.indexOf("contentEditable") !== -1) {
                tabStack.push(aNodes[i]);
            }
        }
    }

    function getTabPrev(oNode) {
        if (!tabStack)
            initTabStack();
        for (var i = tabStack.length - 1; i >= 0; i--) {
            if (tabStack[i] == oNode)
                return tabStack[lastPos = (--i < 0 ? tabStack.length - 1 : i)];
        }
        return tabStack[lastPos] || tabStack[0];
    }

    function getTabNext(oNode) {
        if (!tabStack)
            initTabStack();
        for (var i = 0, l = tabStack.length; i < l; i++) {
            if (tabStack[i] == oNode)
                return tabStack[lastPos = (++i >= l ? 0 : i)];
        }
        return tabStack[lastPos] || tabStack[0];
    }

    var mouseOver, mouseOut, mouseDown;

    function attachBehaviors() {
        apf.AbstractEvent.addListener(_self.oExt, "mouseover", mouseOver = function(e) {
            var el = e.srcElement || e.target;
            if (el == activeNode) return;
            if (el.className && el.className.indexOf("contentEditable") !== -1)
                apf.setStyleClass(el, "contentEditable_over");
        });
        apf.AbstractEvent.addListener(_self.oExt, "mouseout",  mouseOut = function(e) {
            var el = e.srcElement || e.target;
            if (el == activeNode) return;
            if (el.className && el.className.indexOf("contentEditable") !== -1)
                apf.setStyleClass(el, null, ["contentEditable_over"]);
        });
        apf.AbstractEvent.addListener(_self.oExt, "mousedown", mouseDown = function(e) {
            var el = e.srcElement || e.target;
            if (el == activeNode) return; //already in editMode
            if (el.className && el.className.indexOf("contentEditable") !== -1) {
                createEditor(el);
                return false;
            }
            // action confirmed
            else if (activeNode) {
                removeEditor(activeNode, true);
            }
        });
    }

    function detachBehaviors() {
        apf.AbstractEvent.removeListener(_self.oExt, "mouseover", mouseOver);
        apf.AbstractEvent.removeListener(_self.oExt, "mouseout",  mouseOut);
        apf.AbstractEvent.removeListener(_self.oExt, "mousedown", mouseDown);
    }

    this.edit = function(xpath, value) {
        this.executeActionByRuleSet("edit", "edit", this.xmlRoot.ownerDocument
            .selectSingleNode(xpath), value);
    }

};

// #endif