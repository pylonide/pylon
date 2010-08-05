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
apf.__LIVEEDIT__  = 1 << 23;

// #ifdef __WITH_LIVEEDIT

/**
 * Baseclass of an element whose content is editable. This is usually an
 * {@link element.editor}.
 *
 * @constructor
 * @baseclass
 *
 * @inherits apf.Presentation
 * @inherits apf.StandardBinding
 * @inherits apf.DataAction
 *
 * @author      Mike de Boer (mike AT javeline DOT com)
 * @version     %I%, %G%
 * @since       3.0
 */
apf.LiveEdit = function() {
    this.$regbase = this.$regbase | apf.__LIVEEDIT__;

    //#ifdef __WITH_DATAACTION
    this.implement(apf.DataAction || apf.K);
    //#endif
    //#ifdef __WITH_VALIDATION
    this.implement(apf.Validation || apf.K);
    //#endif

    this.$activeDocument = document;
    this.$selection      = null;

    this.$supportedProperties.push("liveedit", "realtime");
    this.$booleanProperties["liveedit"]  = true;
    this.$booleanProperties["realtime"]  = true;
    
    this.$propHandlers["liveedit"]       = function(value){
        if (this.realtime == undefined)
            this.$setInheritedAttribute("realtime");

        if (value) {
            if (!this.$focussable || !this.focussable) {
                this.$focussable   = true;
                this.$unFocussable = [this.$focussable,
                    typeof this.focussable == "undefined" ? true : this.focussable];
                apf.GuiElement.propHandlers.focussable.call(this, true);
            }
            
            if (!this.$mouseOver)
                this.$setMouseEvents();
            
            apf.addListener(this.$ext, "mouseup",   this.$mouseUp);
            apf.addListener(this.$ext, "mousedown", this.$mouseDown);
            apf.addListener(this.$ext, "mouseout",  this.$mouseOut);
            apf.addListener(this.$ext, "mouseover", this.$mouseOver);
            
            this.addEventListener("keydown",   keydownHandler, true);
            this.addEventListener("blur",      blurHandler);
            this.addEventListener("focus",     focusHandler);
            this.addEventListener("load",      loadHandler);
            this.addEventListener("xmlupdate", xmlupdateHandler);
        }
        else {
            if (this.$unFocussable) {
                this.$focussable = this.$unFocussable[0];
                apf.GuiElement.propHandlers.focussable.call(this, this.$unFocussable[1]);
                delete this.$unFocussable;
            }
            
            apf.removeListener(this.$ext, "mouseover", this.$mouseOver);
            apf.removeListener(this.$ext, "mouseout",  this.$mouseOut);
            apf.removeListener(this.$ext, "mousedown", this.$mouseDown);
            apf.removeListener(this.$ext, "mouseup",   this.$mouseUp);

            this.$activeNode     = null;
            this.$lastActiveNode = null;
            
            this.removeEventListener("keydown",   keydownHandler, true);
            this.removeEventListener("blur",      blurHandler);
            this.removeEventListener("focus",     focusHandler);
            this.removeEventListener("load",      loadHandler);
            this.removeEventListener("xmlupdate", xmlupdateHandler);
        }

        this.$tabStack = null; // redraw of editable region, invalidate cache
    };
    
    this.$setMouseEvents = function(){
        var _self = this;
        this.$mouseOver = function(e) {
            var el = e.srcElement || e.target;
            if (!el) return;
            while (el && (!el.className || el.className.indexOf("liveEdit") == -1) && el != _self.$ext)
                el = el.parentNode;
            if (!el || el == _self.$ext || el == _self.$activeNode)
                return;
            apf.setStyleClass(el, "liveEdit_over");
        };
        this.$mouseOut = function(e) {
            var el = e.srcElement || e.target;
            if (!el) return;
            while (el && (!el.className || el.className.indexOf("liveEdit") == -1) && el != _self.$ext)
                el = el.parentNode;
            if (!el || el == _self.$ext || el == _self.$activeNode)
                return;
            apf.setStyleClass(el, null, ["liveEdit_over"]);
        };
        this.$mouseDown = function(e) {
            apf.cancelBubble(e);
            var el = e.srcElement || e.target;
            if (!el) return;
            if (_self.$activeNode && _self.$selection && apf.isChildOf(_self.$activeNode, el, true))
                $setTimeout(function(){_self.$selection.cache();});

            while (el && (!el.className || el.className.indexOf("liveEdit") == -1) && el != _self.$ext)
                el = el.parentNode;

            if (!el || el == _self.$ext) {
                if (_self.$activeNode)
                    removeEditor.call(_self, _self.$activeNode, true);
                return;
            }

            createEditor.call(_self, el);
            if (!_self.$lastTemplate) {
                e.cancelBubble = true;
                apf.window.$mousedown({srcElement: _self.$activeNode});
                $setTimeout(function(){
                    //@todo Mike. The cursor position is lost!!! Please help me!
                    _self.$selection.set();
                    if (_self.$activeNode)
                        _self.$activeNode.focus();
                }, 10);
            }
            else {
                $setTimeout(function(){
                    _self.$lastTemplate.childNodes[0].focus();
                }, 100);
                _self.$lastTemplate.childNodes[0].slideDown();
            }

            return false;
        };
        this.$mouseUp = function(e) {
            var el = e.srcElement || e.target;
            if (_self.$activeNode && _self.$selection && apf.isChildOf(_self.$activeNode, el, true))
                _self.$selection.cache();
        };
    }

    function focusHandler(e){
        if (this.$skipFocusOnce && !(this.$skipFocusOnce = false)) {
            this.$lastActiveNode = null;
            return;
        }

        this.setProperty("state", (this.$pluginsActive == "code")
            ? apf.DISABLED
            : apf.OFF);

        if (this.$lastActiveNode && this.$lastActiveNode.parentNode
          || typeof e.shiftKey == "boolean") {
            createEditor.call(this, this.$lastActiveNode || (this.$tabStack
                || initTabStack.call(this))[e.shiftKey ? this.$tabStack.length - 1 : 0]);

            if (this.$lastActiveNode && !this.$lastTemplate)
                this.$lastActiveNode.focus();
        }
        this.$lastActiveNode = null;
        
        if (this.$lastTemplate) {
            this.$lastTemplate.childNodes[0].focus();
        }
        else if (this.$activeNode) {
            var _self = this,
                node  = this.$activeNode;
            $setTimeout(function(){
                //this.$selection.selectNode(node);
                _self.$selection.set();
                if (node.parentNode) //@todo why?
                    node.focus();
            }, 10);
        }
    }
    
    function blurHandler(e){
        this.$lastActiveNode = this.$activeNode || this.$lastActiveNode;
        //@todo should be recursive in refactor 
        if (e.toElement && (e.toElement == this.$docklet
          || e.toElement.parentNode == this.$lastTemplate))
            return;

        var pParent = apf.popup.last && apf.lookup(apf.popup.last);
        if (pParent && pParent.editor == this)
            apf.popup.forceHide();

        if (this.$selection)
            this.$selection.cache();
        removeEditor.call(this, this.$activeNode, true);

        this.setProperty("state", apf.DISABLED);
    }

    function loadHandler(){
        createEditor.call(this, initTabStack.call(this)[0]);
    }

    function xmlupdateHandler(){
        initTabStack.call(this);
    }
    //@todo skin change

    /**
     * Event handler; fired when the user pressed a key inside the editor IFRAME.
     * For IE, we apply some necessary behavior correction and for other browsers, like
     * Firefox and Safari, we enable some of the missing default keyboard shortcuts.
     *
     * @param {Event} e
     * @type {Boolean}
     * @private
     */
    function keydownHandler(e) {
        //if (!this.$bStandalone)
            //return;

        var oNode, isDone, found,
            code = e.which || e.keyCode;
        
        if (!this.$activeNode) {
            //F2 starts editing
            if (code == 113) {
                if (this.$selected) {
                    var nodes = this.$selected.getElementsByTagName("*");
                    for (var i = nodes.length - 1; i >= 0; i--) {
                        if ((nodes[i].className || "").indexOf("liveEdit") > -1) {
                            oNode = nodes[i];
                            break;
                        }
                    }
                }
                
                createEditor.call(this, oNode || (this.$tabStack || initTabStack.call(this))[0]);
                if (this.$activeNode) {
                    this.$activeNode.focus();
                    this.$selection.selectNode(this.$activeNode);
                    this.$selection.collapse();
                    try {
                        this.$activeDocument.execCommand("SelectAll", false, true);
                    }
                    catch(e) {}
                }
            }
            return;
        }
        
        if (code == 13) { //Enter
            isDone = e.ctrlKey || (apf.isMac && e.metaKey);
            if (!isDone)
                isDone = !apf.isTrue(this.$activeNode.getAttribute("multiline"));
            e.returnValue = true;
        }
        
        this.$visualFocus();
        
        // Tab navigation handling
        if (code == 9 || isDone) {
            var idx,
                bShift = e.shiftKey,
                // a callback is passed, because the call is a-sync
                lastPos = (this.$tabStack || initTabStack.call(this)).indexOf(this.$activeNode);
            oNode = this.$activeNode;
            removeEditor.call(this, this.$activeNode, true) || initTabStack.call(this)[lastPos];
            oNode = this.$tabStack[
                (idx = this.$tabStack.indexOf(oNode) + (bShift ? -1 : 1)) < this.$tabStack.length 
                    ? idx < 0 ? this.$tabStack.length -1 : idx
                    : 0
            ];

            if (oNode) {
                createEditor.call(this, oNode);
                if (this.$lastTemplate) {
                    this.$lastTemplate.childNodes[0].focus();
                }
                else if (oNode.parentNode) { //this.$lastTemplate
                    oNode.focus();
                    try {
                        //this.$selection.selectNode(oNode.firstChild);
                        this.$activeDocument.execCommand("SelectAll", false, true);
                    }
                    catch(e) {}
                }
                found = true;
            }
        }
        // Esc key handling
        else if (code == 27) {
            removeEditor.call(this, this.$activeNode);
            found = true;
        }
        
        if (!e.ctrlKey && !e.altKey && !e.metaKey && (code < 112 || code > 122)
          && (code < 33  && code > 31 || code > 42 || code == 8 || code == 13)) {
            resumeChangeTimer();
            // remove the content of a selection manually when it's ranging
            // multiple DOM nodes
            if (apf.w3cRange && !this.$selection.isCollapsed() && apf.isCharacter(code))
                this.$selection.remove();
        }

        if (found)
            return apf.stopEvent(e);
        else if (this.$activeNode)
            e.returnValue = -1; //@todo what is this for?
    };
    
    function createEditor(oHtml) {
        if (!oHtml || oHtml.nodeType != 1 || this.$activeNode == oHtml || !this.xmlRoot)
            return;
    
        var _self = this;
        var hasRule = oHtml.getAttribute("options");
        var rule = hasRule && apf.unserialize(hasRule.replace(/&quot;/g, '"').unescapeHTML()) || {};
        oHtml.setAttribute("multiline", rule.multiline || "false"); //For lookup at keydown 13

        //Initialize selection
        if (!this.$selection)
            this.$selection = new apf.selection();

        if (this.$activeNode) {
            var lastPos = initTabStack.call(this).indexOf(oHtml);//tabStack can be old...
            removeEditor.call(this, this.$activeNode, true);
            oHtml = initTabStack.call(this)[lastPos];
            $setTimeout(function(){oHtml.focus();}, 10);
        }

        //Check Validation of previous element
        /*if (this.validityState && !this.validityState.valid) {
            oHtml = initTabStack.call(this)[this.validityState.$lastPos];
            $setTimeout(function(){
                oHtml.focus();
                _self.$selection.selectNode(oHtml);
                // @todo need to select all contents here?
                _self.$selection.collapse();
                try {
                    _self.$activeDocument.execCommand("SelectAll", false, true);
                }
                catch(e) {}
                _self.getModel(true).validate(xmlNode, false, _self.validityState, _self);
            }, 10);
        }*/

        //@todo this fucks undo state - elements created here are not undone
        var xmlNode = apf.createNodeFromXpath(this.xmlRoot.ownerDocument,
            oHtml.getAttribute("xpath")),
            v;

        //@todo dirty hack, how to solve this properly
        if (this.hasFocus && !this.hasFocus())
            this.$skipFocusOnce = true;

        this.$activeNode = oHtml;
        apf.setStyleClass(oHtml, "liveEdit_active", ["liveEdit_over"]);

        /**
         * @todo for template
         *  - Focus handling enters at the first and leaves at the last both entry/leave
         *    are from/to parent element
         *  - Parent focus/blur events aren't called ($focus / $blur should use event system)
         *  - Keyboard events for leave (both ends) are forwarded to parent
         *  - Attach manages height of container
         *  - Attach code / Detach code
         */
        if (rule.editor) {
            this.$custom(rule, oHtml);
        }
        else {
            if (apf.hasContentEditable)
                oHtml.contentEditable = true;
            else {
                document.body.setAttribute("spellcheck", "false");
                document.designMode = "on";
            }
            
            if (apf.isGecko) {
                try {
                    // On each return, insert a BR element
                    document.execCommand("insertBrOnReturn", false, true);
                }catch(e){}
            }
        }
        
        //#ifdef __WITH_WINDOW_FOCUS
        if (apf.hasFocusBug) {
            //@todo this leaks like a ..
            apf.sanitizeTextbox(oHtml);
            oHtml.onselectstart = function(e) {
                e = e || window.event;
                e.cancelBubble = true;
            };
        }
        //#endif

        this.$lastValue = oHtml.innerHTML;
    
        rule.htmlNode = oHtml;
        this.dispatchEvent("$createEditor", rule);
    }
    
    //@todo
    this.$custom = function(rule, oHtml){
        return;
        
        if (!rule.$template) {
            var nodes = rule.node.childNodes;
            // @todo fix this
            rule.$template = apf.document.appendChild(apf.document.createElement("template"));
            for (var i = 0, l = nodes.length; i < l; i++) {
                if (nodes[i].nodeType != 1)
                    continue;
                rule.$template.appendChild(apf.document.createElement(nodes[i]));
            }
        }
        rule.$lastHeight = oHtml.style.height;
        rule.$template.attach(oHtml, null, true);
        oHtml.style.height = (oHtml.scrollHeight - apf.getHeightDiff(oHtml) + 2) + "px";

        rule.$template.childNodes[0].onblur = function(e){
            if (e.toElement && e.toElement != _self) {
                _self.dispatchEvent("blur");
            }
            else {
                if (e.toElement)
                    this.$skipFocusOnce = true;
                else
                    _self.dispatchEvent("blur");
                _self.focus(null, null, true);
            }
        };
        //@todo buggy should be no events in refactor apf3.0
        rule.$template.childNodes[0].onafterchange = function(){
            //this.$skipFocusOnce = true;
            //_self.focus();
        };
        rule.$template.childNodes[0].onkeydown = function(e){
            if (e.keyCode == 9) {
                e.currentTarget = null;
                _self.dispatchEvent("keydown", e, true);
                return false;
            }
        };
        rule.$template.childNodes[0].setValue(apf.queryValue(xmlNode));
        //rule.$template.childNodes[0].focus(); //@todo general focus problem for subchildren
        this.$lastTemplate = rule.$template;
        return;
    }
    
    this.isValid = function(checkRequired){
        //@todo only place for checkRequired
    };
    
    function removeEditor(oHtml, bProcess, callback) {
        if (!oHtml) oHtml = this.$activeNode;
        if (!oHtml || oHtml.nodeType != 1) return false;

        var xpath   = oHtml.getAttribute("xpath"),
            xmlNode = this.xmlRoot.ownerDocument.selectSingleNode(xpath),
            hasRule = oHtml.getAttribute("options"),
            rule    = hasRule && apf.unserialize(hasRule.replace(/&quot;/g, '"').unescapeHTML()) || {};

        this.$activeNode = null;
        apf.setStyleClass(oHtml, null, ["liveEdit_over", "liveEdit_active"]);
        this.$selection.collapse(true);

        if (rule.editor) {
            
        }
        else if (apf.hasContentEditable)
            oHtml.contentEditable = false;
        else
            document.designMode = "off";

        if (!bProcess || this.$lastValue && oHtml.innerHTML.toLowerCase().replace(/[\r\n]/g, "")
          == (this.$lastValue.dataType == apf.ARRAY ? this.$lastValue[0] : this.$lastValue).toLowerCase().replace(/[\r\n]/g, "")) {
            oHtml.innerHTML = this.$lastValue.dataType == apf.ARRAY ? this.$lastValue[1] : this.$lastValue;
            return false;
        }
        
        // do additional handling, first we check for a change in the data...
        // @todo this will not always work in IE
        if (apf.queryValue(this.xmlRoot.ownerDocument, xpath) != oHtml.innerHTML) { //@todo this is bullshit
            rule.htmlNode = oHtml;
            var res = this.dispatchEvent("$removeEditor", rule);
            if (!res)
                res = apf.html_entity_decode(oHtml.innerHTML.replace(/<br\s*\/?>/g, "\n"));
            
            var valid;
            //#ifdef __WITH_VALIDATION
            if (this.validityState)
                this.validityState.$reset();
            
            if (hasRule) {
                apf.validator.compile(rule).call(this, 
                    res, false, this.validityState || 
                    (this.validityState = new apf.validator.validityState()));

                this.invalidmsg = valid ? "" : rule.invalidmsg || "";
                
                var valid = this.validityState.valid;
                if (!valid) {
                    this.validityState.$errorHtml = oHtml;
                    this.dispatchEvent("invalid", this.validityState);
                    this.setError();
                }
                else
                    this.clearError();
            };
            //#endif
            
            if (valid !== false) {
                this.$executeAction("setValueByXpath", 
                  [this.xmlRoot.ownerDocument, res, xpath], 
                  "setValueByXpath", xmlNode);
            }
        }

        if (callback)
            $setTimeout(callback);
    }

    function initTabStack() {
        this.$tabStack = [];
        var aNodes = this.$ext.getElementsByTagName("*");
        for (var i = 0, l = aNodes.length; i < l && aNodes[i].nodeType == 1; i++) {
            if (aNodes[i].className
              && aNodes[i].className.indexOf("liveEdit") != -1) {
                this.$tabStack.push(aNodes[i]);
            }
        }
        return this.$tabStack;
    }

    /**
     * Give or return the focus to the editable area, hence 'visual' focus.
     *
     * @param {Boolean} bNotify Flag set to TRUE if plugins should be notified of this event
     * @type  {void}
     */
    this.$visualFocus = function(bNotify) {
        // setting focus to the iframe content, upsets the 'code' plugin
        var bCode = (this.$pluginsActive == "code");
        if (this.$bStandalone && apf.document.activeElement == this && !bCode) {
            try {
                this.$oWin.focus();
            }
            catch(e) {};
        }
        else if (!this.$bStandalone && this.$activeNode) {
            this.$activeNode.focus();
        }

        if (bCode) {
            this.$notifyAllButtons(apf.DISABLED);
            this.$notifyButton("code", apf.SELECTED);
        }
        else if (bNotify)
            this.$notifyAllButtons();
    };
    
    /**
     * Firing change(), when the editor is databound, subsequently after each
     * keystroke, can have a VERY large impact on editor performance. That's why
     * we delay the change() call.
     *
     * @type {void}
     */
    function resumeChangeTimer() {
        if (!this.realtime || this.$changeTimer !== null) 
            return;

        this.$changeTimer = $setTimeout(function() {
            clearTimeout(this.$changeTimer);
            console.log("resuming change....");
            if (this.$bStandalone) {
                // #ifdef __WITH_DATAACTION
                this.change(this.getValue());
                /* #else
                this.setProperty("value", this.getValue())
                #endif*/
            }
            this.$changeTimer = null;
        }, 200);
    }

    // #ifdef __ENABLE_LIVEEDIT_RICHTEXT || __INC_ALL
    //apf.LiveEdit.richtext.call(this);
    // #endif
};

apf.config.$inheritProperties["liveedit"] = 2;
// #endif
