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

    var wasFocussable, lastValue, mouseOver, mouseOut, mouseDown,
        objectHandles = false,
        tableHandles  = false,
        lastPos       = 0,
        activeNode    = null,
        tabStack      = null,
        oSel          = null,
        _self         = this;

    this.$booleanProperties["contenteditable"] = true;
    this.$propHandlers["contenteditable"]      = function(value){
        if (apf.isTrue(value)) {
            apf.addListener(_self.oExt, "mouseover", mouseOver = function(e) {
                var el = e.srcElement || e.target;
                if (el == activeNode) return;
                if (el.className && el.className.indexOf("contentEditable") != -1)
                    apf.setStyleClass(el, "contentEditable_over");
            });
            apf.addListener(_self.oExt, "mouseout",  mouseOut = function(e) {
                var el = e.srcElement || e.target;
                if (el == activeNode) return;
                if (el.className && el.className.indexOf("contentEditable") != -1)
                    apf.setStyleClass(el, null, ["contentEditable_over"]);
            });
            apf.addListener(_self.oExt, "mousedown", mouseDown = function(e) {
                var el = e.srcElement || e.target;
                if (el == activeNode) return; //already in editMode
                if (el.className && el.className.indexOf("contentEditable") != -1) {
                    createEditor(el);
                    return false;
                }
                // action confirmed
                else if (activeNode) {
                    removeEditor(activeNode, true);
                }
            });

            wasFocussable = [this.$focussable, this.focussable];
            this.$focussable = true;
            this.setProperty("focussable", true);
        }
        else {
            apf.removeListener(_self.oExt, "mouseover", mouseOver);
            apf.removeListener(_self.oExt, "mouseout",  mouseOut);
            apf.removeListener(_self.oExt, "mousedown", mouseDown);

            this.$focussable = wasFocussable[0];
            this.setProperty("focussable", wasFocussable[1]);
        }

        tabStack = null; // redraw of editable region, invalidate cache
        this.reload();
    };
    
    var lastActiveNode;
    this.addEventListener("focus", function(e){
        if (!this.contenteditable || skipFocusOnce && !(skipFocusOnce = false))
            return;

        if (lastActiveNode || typeof e.shiftKey == "boolean") {
            createEditor(lastActiveNode || (tabStack 
                || initTabStack())[e.shiftKey ? tabStack.length - 1 : 0]);

            if (lastActiveNode) {
                lastActiveNode.focus();
                lastActiveNode = null;
            }
            
            var node = activeNode.firstChild;
            setTimeout(function(){oSel.selectNode(node);});
        }
    });
    
    this.addEventListener("blur", function(){
        if (!this.contenteditable)
            return;
        
        lastActiveNode = activeNode;
        removeEditor();
    });

    var skipFocusOnce;
    function createEditor(oNode) {
        if (!oNode || oNode.nodeType != 1 || activeNode == oNode) 
            return;
        if (activeNode)
            removeEditor(activeNode, true);

        if (!_self.hasFocus())
            skipFocusOnce = true;

        activeNode = oNode;
        apf.setStyleClass(oNode, "contentEditable_active", ["contentEditable_over"]);
        
        if (apf.isIE) {
            oNode.contentEditable = true;
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

        lastValue = oNode.innerHTML;

        //#ifdef __WITH_WINDOW_FOCUS
        if (apf.hasFocusBug) {
            //@todo this leaks like a ..
            apf.sanitizeTextbox(oNode);
            oNode.onselectstart = function(e) {
                e = e || window.event;
                e.cancelBubble = true;
            };
        }
        //#endif

        oSel = new apf.selection(window, document);
        oSel.cache();
    }

    function removeEditor(oNode, bProcess, callback) {
        if (!oNode) oNode = activeNode;
        if (!oNode || oNode.nodeType != 1) return;
        oSel.collapse(true);

        activeNode = null;

        apf.setStyleClass(oNode, null, ["contentEditable_over", "contentEditable_active"]);

        if (apf.isIE)
            oNode.contentEditable = false;
        else
            document.designMode = "off";

        if (!bProcess) {
            oNode.innerHTML = lastValue;
            return;
        }
        // do additional handling, first we check for a change in the data...
        var xpath = oNode.getAttribute("xpath");
        if (apf.queryValue(_self.xmlRoot.ownerDocument, xpath) != oNode.innerHTML) {
            _self.edit(xpath, oNode.innerHTML);
        }

        if (callback)
            setTimeout(callback);
    }

    function execCommand(name, param) {
        oSel.cache();
        (apf.isIE ? activeNode : document).execCommand(name, false, param);
    }

    _self.addEventListener("load", function(){
        if (!this.contenteditable)
            return;

        createEditor(initTabStack()[0]);
    });
    _self.addEventListener("xmlupdate", function(){
        tabStack = null; // redraw of editable region, invalidate cache
    });
    //@todo skin change
    
    _self.addEventListener("keydown", function(e) {
        e = e || window.event;
        var code = e.which || e.keyCode;
        
        if (!activeNode) {
            //F2 starts editing
            if (code == 113) {
                //@todo find the item of the this.$selected
                createEditor((tabStack || initTabStack())[0]);
                if (activeNode) {
                    activeNode.focus();
                    oSel.selectNode(activeNode.firstChild);
                }
            }
            
            return;
        }
        
        oSel.cache();
        var el = oSel.getSelectedNode(), found;

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
                  && el.className.indexOf("contentEditable") != -1))
                    el = el.parentNode;

                if (el.className && el.className.indexOf("contentEditable") != -1) {
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
            e.returnValue = false;
            return false;
        }

        if (apf.isIE) {
            if (code == 8 && oSel.getType() == "Control") {
                oSel.remove();
                found = true;
            }
        }
        else if ((e.ctrlKey || (apf.isMac && e.metaKey)) && !e.shiftKey && !e.altKey) {
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
        
        // Tab navigation handling
        if (code == 9) {
            var bShift = e.shiftKey,
                oNode  = (tabStack || initTabStack())[
                    (lastPos = tabStack.indexOf(activeNode) + (bShift ? -1 : 1))
                  ];
            if (oNode) {
                // a callback is passed, because the call is a-sync
                removeEditor(activeNode, true);
                // re-fetch, because data may been reloaded
                oNode = (tabStack || initTabStack())[lastPos];
                createEditor(oNode);
                oSel.selectNode(oNode.firstChild);

                found = true;
            }
            else {
                removeEditor();
            }
        }
        // Esc key handling
        else if (code == 27) {
            removeEditor(activeNode);
            found = true;
        }

        if (found) {
            e.returnValue = false;
            return false;
        }

        //document.onkeydown(e);
    }, true);

    function initTabStack() {
        tabStack = [];
        var aNodes = _self.oExt.getElementsByTagName("*");
        for (var i = 0, l = aNodes.length; i < l && aNodes[i].nodeType == 1; i++) {
            if (aNodes[i].className
              && aNodes[i].className.indexOf("contentEditable") != -1) {
                tabStack.push(aNodes[i]);
            }
        }
        return tabStack;
    }

    this.edit = function(xpath, value) {
        this.executeActionByRuleSet("edit", "edit", this.xmlRoot.ownerDocument
            .selectSingleNode(xpath), value);
    }
};

// #endif