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
ppc.__LIVEEDIT__  = 1 << 23;

// #ifdef __WITH_LIVEEDIT

/**
 * Baseclass of an element whose content is editable. This is usually an
 * {@link element.editor}.
 *
 * @constructor
 * @baseclass
 *
 * @inherits ppc.Presentation
 * @inherits ppc.StandardBinding
 * @inherits ppc.DataAction
 *
 * @author      Mike de Boer (mike AT javeline DOT com)
 * @version     %I%, %G%
 * @since       3.0
 */
ppc.LiveEdit = function() {
    this.$regbase = this.$regbase | ppc.__LIVEEDIT__;

    //#ifdef __WITH_DATAACTION
    this.implement(ppc.DataAction || ppc.K);
    //#endif
    //#ifdef __WITH_VALIDATION
    this.implement(ppc.Validation || ppc.K);
    //#endif

    this.$activeDocument = document;
    this.$selection      = null;
    this.$activeNode     = null;
    this.$lastActiveNode = null;
    this.$activeIndex    = 0;

    this.$supportedProperties.push("liveedit", "realtime");
    this.$booleanProperties["liveedit"]  = true;
    this.$booleanProperties["realtime"]  = true;
    
    this.$propHandlers["liveedit"]       = function(value){
        if (this.childNodes.length && !this.hasFeature(ppc.__CHILDVALUE__)) //@todo rearch this
            return;

        if (this.realtime == undefined)
            this.$setInheritedAttribute("realtime");
            
        if (value) {
            if (!this.$focussable || !this.focussable) {
                this.$focussable   = true;
                this.$unFocussable = [this.$focussable,
                    typeof this.focussable == "undefined" ? true : this.focussable];
                ppc.GuiElement.propHandlers.focussable.call(this, true);
            }
            
            if (!this.$leMouseOver)
                this.$setMouseEvents();

            ppc.addListener(this.$ext, "mouseup",   this.$leMouseUp);
            ppc.addListener(this.$ext, "mousedown", this.$leMouseDown);
            ppc.addListener(this.$ext, "mouseout",  this.$leMouseOut);
            ppc.addListener(this.$ext, "mouseover", this.$leMouseOver);
            
            this.addEventListener("keydown",   keydownHandler, true);
            this.addEventListener("blur",      blurHandler);
            this.addEventListener("focus",     focusHandler);
            this.addEventListener("load",      loadHandler);

            if (this.nodeType == 7)
                this.addEventListener("prop.calcdata", xmlupdateHandler);
            else if (this.hasFeature(ppc.__CHILDVALUE__)) 
                this.addEventListener("prop." + this.$childProperty, xmlupdateHandler);
            else
                this.addEventListener("xmlupdate", xmlupdateHandler);
        }
        else if (this.$leMouseOver) {
            if (this.$unFocussable) {
                this.$focussable = this.$unFocussable[0];
                ppc.GuiElement.propHandlers.focussable.call(this, this.$unFocussable[1]);
                delete this.$unFocussable;
            }
            
            ppc.removeListener(this.$ext, "mouseover", this.$leMouseOver);
            ppc.removeListener(this.$ext, "mouseout",  this.$leMouseOut);
            ppc.removeListener(this.$ext, "mousedown", this.$leMouseDown);
            ppc.removeListener(this.$ext, "mouseup",   this.$leMouseUp);

            this.$activeNode     = null;
            this.$lastActiveNode = null;
            
            this.removeEventListener("keydown",   keydownHandler, true);
            this.removeEventListener("blur",      blurHandler);
            this.removeEventListener("focus",     focusHandler);
            this.removeEventListener("load",      loadHandler);

            if (this.nodeType == 7)
                this.removeEventListener("prop.calcdata", xmlupdateHandler);
            else if (this.hasFeature(ppc.__CHILDVALUE__)) 
                this.removeEventListener("prop." + this.$childProperty, xmlupdateHandler);
            else
                this.removeEventListener("xmlupdate", xmlupdateHandler);
        }

        this.$tabStack = null; // redraw of editable region, invalidate cache
    };
    
    this.$setMouseEvents = function(){
        var _self = this, moEditor;
        
        function focusHandler(){
            moEditor.removeEventListener("focus", focusHandler);
            ppc.removeListener(moEditor.$ext, "mouseout", extOutHandler);
            moEditor = null;
        }
        
        function removeHandler(){
            ppc.removeListener(moEditor.$ext, "mouseout", extOutHandler);
            if (_self.$lastEditor && _self.$lastEditor[0] == moEditor)
                removeEditor.call(_self, _self.$activeNode, true);
            moEditor.removeEventListener("focus", focusHandler);
            moEditor = null;
        }
        
        function extOutHandler(){
            if (!_self.$lastEditor) {
                ppc.removeListener(moEditor.$ext, "mouseout", extOutHandler);
                return;
            }
                
            if (moEditor && !moEditor.hasFocus())
                removeHandler.call(moEditor);
        }
        
        this.$leMouseOver = function(e) {
            var el = e.srcElement || e.target;
            if (!el) return;
            while (el && (!el.className || el.className.indexOf("liveEdit") == -1) && el != _self.$ext)
                el = el.parentNode;
            if (!el || el == _self.$ext || el == _self.$activeNode)
                return;
            
            if (moEditor)
                removeHandler.call(moEditor);
            
            var editor = el.getAttribute("editor");
            if (editor && "richtext|default".indexOf(editor) == -1 && !_self.$activeNode) {
                createEditor.call(_self, el);
                moEditor = _self.$lastEditor[0];
                moEditor.addEventListener("focus", focusHandler);
                ppc.addListener(moEditor.$ext, "mouseout", extOutHandler);
            }
            else
                ppc.setStyleClass(el, "liveEditOver");
        };
        this.$leMouseOut = function(e) {
            var el = e.srcElement || e.target;
            if (!el) return;
            while (el && (!el.className || el.className.indexOf("liveEdit") == -1) && el != _self.$ext)
                el = el.parentNode;
            if (!el || el == _self.$ext || el == _self.$activeNode)
                return;

            ppc.setStyleClass(el, null, ["liveEditOver"]);
        };
        this.$leMouseDown = function(e, preventPropagation) {
            if (!preventPropagation)
                ppc.cancelBubble(e);

            var el = e.srcElement || e.target;
            if (!el) return;
            if (_self.$activeNode && _self.$selection && ppc.isChildOf(_self.$activeNode, el, true))
                $setTimeout(function(){_self.$selection.cache();});

            while (el && (!el.className || el.className.indexOf("liveEdit") == -1) && el != _self.$ext)
                el = el.parentNode;

            if (!el || el == _self.$ext) {
                if (_self.$activeNode)
                    removeEditor.call(_self, _self.$activeNode, true);
                return;
            }

            createEditor.call(_self, el);
            if (!_self.$lastEditor && !preventPropagation) {
                e.cancelBubble = true;
                ppc.window.$mousedown({srcElement: _self.$activeNode});
                $setTimeout(function(){
                    //_self.$selection.set();
                    if (_self.$activeNode)
                        _self.$activeNode.focus();
                }, 10);
            }
            else {
                /*$setTimeout(function(){
                    _self.$lastEditor[0].focus();
                }, 100);*/
                //_self.$lastEditor.childNodes[0].slideDown();
            }

            return false;
        };
        this.$leMouseUp = function(e) {
            var el = e.srcElement || e.target;
            if (_self.$activeNode && _self.$selection && ppc.isChildOf(_self.$activeNode, el, true))
                _self.$selection.cache();
        };
    }

    function focusHandler(e){
        if (this.$skipFocusOnce && !(this.$skipFocusOnce = false)) {
            this.$lastActiveNode = null;
            return;
        }

        this.setProperty("state", (this.$pluginsActive == "code")
            ? ppc.DISABLED
            : ppc.OFF);

        if (this.$lastActiveNode && this.$lastActiveNode.parentNode
          || typeof e.shiftKey == "boolean") {
            createEditor.call(this, this.$lastActiveNode || (this.$tabStack
                || initTabStack.call(this))[e.shiftKey ? this.$tabStack.length - 1 : 0]);

            if (this.$lastActiveNode && !this.$lastEditor)
                this.$lastActiveNode.focus();
        }
        this.$lastActiveNode = null;
        
        if (this.$lastEditor) {
            //this.$lastEditor[0].focus();
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
          || e.toElement.parentNode == this.$lastEditor))
            return;

        var pParent = ppc.popup.last && ppc.lookup(ppc.popup.last);
        if (pParent && pParent.editor == this)
            ppc.popup.forceHide();

        if (this.$selection)
            this.$selection.cache();
        removeEditor.call(this, this.$activeNode, true);

        this.setProperty("state", ppc.DISABLED);
    }

    function loadHandler(){
        createEditor.call(this, initTabStack.call(this)[0]);
    }

    function xmlupdateHandler(){
        if (!this.$skipChange) {
            initTabStack.call(this);
            //this.$activeNode = null;
        }
    }
    //@todo skin change

    var commandKeys = {
        66  : 1,  // B
        98  : 1,  // b
        105 : 1, // i
        73  : 1,  // I
        117 : 1, // u
        85  : 1  // U
    };
     
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
            isDone = e.ctrlKey || (ppc.isMac && e.metaKey);
            if (!isDone)
                isDone = !ppc.isTrue(this.$activeNode.getAttribute("multiline"));
            e.returnValue = true;
        }
        
        this.$visualFocus();
        
        // Tab navigation handling
        if (code == 9 || isDone) {
            if (!this.$tabStack)
                initTabStack.call(this);
            var idx,
                bShift = e.shiftKey;
            oNode = this.$activeNode;
            removeEditor.call(this, this.$activeNode, true) || initTabStack.call(this)[this.$activeIndex];
            oNode = this.$tabStack[this.$activeIndex + (bShift ? -1 : 1)];

            if (oNode) {
                createEditor.call(this, oNode);
                if (this.$lastEditor) {
                    this.$lastEditor[0].focus();
                }
                else if (oNode.parentNode) { //this.$lastEditor
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
            removeEditor.call(this);
            found = true;
        }
        else if (ppc.isIE && e.ctrlKey && commandKeys[code]) {
            found = true;
        }
        
        if (!e.ctrlKey && !e.altKey && !e.metaKey && (code < 112 || code > 122)
          && (code < 33  && code > 31 || code > 42 || code == 8 || code == 13)) {
            if (this.realtime && this.$changeTimer === null && this.$bStandalone) { //@todo realtime not supported for liveedit inline
                var _self = this;
                this.$changeTimer = $setTimeout(function() {
                    clearTimeout(_self.$changeTimer);
                    
                    // #ifdef __WITH_DATAACTION
                    _self.change(_self.getValue());
                    /* #else
                    _self.setProperty("value", _self.getValue())
                    #endif*/
                    
                    _self.$changeTimer = null;
                }, 200);
            }
            
            // remove the content of a selection manually when it's ranging
            // multiple DOM nodes
            
            
            if (ppc.w3cRange && !this.$selection.isCollapsed() && ppc.isCharacter(code)) {
                if (this.$activeNode.innerHTML.trim() != '')
                    this.$selection.remove();
                //else
                    //debugger;
            }
        }

        if (found)
            return ppc.stopEvent(e);
        else if (this.$activeNode)
            e.returnValue = -1; //@todo what is this for?
    }
    
    function createEditor(oHtml) {
        if (!oHtml || oHtml.nodeType != 1 || this.$activeNode == oHtml || !this.xmlRoot)
            return;
    
        var _self = this;
        var hasRule = getOptions(oHtml);
        var rule = hasRule && ppc.unserialize(hasRule.replace(/&quot;/g, '"').unescapeHTML()) || {};
        oHtml.setAttribute("multiline", rule.multiline || "false"); //For lookup at keydown 13

        //Initialize selection
        if (!this.$selection)
            this.$selection = new ppc.selection();

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
        //var xmlNode = ppc.createNodeFromXpath(this.xmlRoot.ownerDocument,
        //    oHtml.getAttribute("xpath"));

        //@todo dirty hack, how to solve this properly
        if (this.hasFocus && !this.hasFocus())
            this.$skipFocusOnce = true;

        this.$activeNode  = oHtml;
        this.$activeIndex = (this.$tabStack || initTabStack.call(this)).indexOf(oHtml);
        ppc.setStyleClass(oHtml, "liveEditActive", ["liveEditOver", "liveEditInitial"]);

        if (oHtml.innerHTML == rule.initial)
            oHtml.innerHTML = "";

        this.$lastValue = oHtml.innerHTML;

        var handler = this.$editors[rule.editor || "default"] || this.$editors.custom;
        handler.create.call(this, oHtml, rule, getXpath(oHtml));
        
        //#ifdef __WITH_WINDOW_FOCUS
        if (ppc.hasFocusBug) {
            //@todo this leaks like a -> use ppc.addListener
            ppc.sanitizeTextbox(oHtml);
        }
        //#endif
        
        this.dispatchEvent("$createEditor", rule);
    }
    
    function getXpath(node){
        return node.getAttribute("xpath").replace(/\\([\[\{\]\}])/g, "$1");
    }
    
    function getOptions(node){
        return (node.getAttribute("options") || "").replace(/\\([\[\{\]\}])/g, "$1");
    }
    
    function removeEditor(oHtml, bProcess, callback) {
        if (!oHtml) oHtml = this.$activeNode;
        if (!oHtml || oHtml.nodeType != 1) return false;

        var xpath   = getXpath(oHtml),
            xmlNode = xpath.indexOf("queryNode") > -1
                ? eval(xpath) 
                : this.xmlRoot.ownerDocument.selectSingleNode(xpath),
            hasRule = getOptions(oHtml),
            rule    = hasRule && ppc.unserialize(hasRule.replace(/&quot;/g, '"').unescapeHTML()) || {};

        this.$activeNode = null;
        ppc.setStyleClass(oHtml, null, ["liveEditOver", "liveEditActive"]);
        this.$selection.collapse(true);

        var handler = this.$editors[rule.editor || "default"] || this.$editors.custom;
        var execChange = handler.remove.call(this, oHtml, rule, xpath);

        if (execChange !== false) {
            if (!bProcess || this.$lastValue && oHtml.innerHTML.toLowerCase().replace(/[\r\n]/g, "")
              == (this.$lastValue.dataType == ppc.ARRAY
              ? this.$lastValue[0] : this.$lastValue).toLowerCase().replace(/[\r\n]/g, "")) {
                oHtml.innerHTML = this.$lastValue.dataType == ppc.ARRAY 
                    ? this.$lastValue[1]
                    : this.$lastValue;
            }
            else {
                // do additional handling, first we check for a change in the data...
                // @todo this will not always work in IE
                // @todo this is bullshit, because it tests on unparsed data --> incorrect
                var value = xpath.indexOf("queryNode") > -1
                    ? eval(xpath.replace("queryNode", "queryValue")) 
                    : ppc.queryValue(this.xmlRoot.ownerDocument, xpath);
                if (value != oHtml.innerHTML) {
                    rule.htmlNode = oHtml;
                    var res = this.getValue(oHtml);
                    
                    var valid;
                    //#ifdef __WITH_VALIDATION
                    if (this.validityState)
                        this.validityState.$reset();
                    
                    if (hasRule) {
                        ppc.validator.compile(rule).call(this, 
                            res, false, this.validityState || 
                            (this.validityState = new ppc.validator.validityState()));
        
                        this.invalidmsg = valid ? "" : rule.invalidmsg || "";
                        
                        valid = this.validityState.valid;
                        if (!valid) {
                            this.validityState.$errorHtml = oHtml;
                            this.dispatchEvent("invalid", this.validityState);
                            this.setError();
                        }
                        else
                            this.clearError();
                    }
                    //#endif
                    
                    if (valid !== false) {
                        if (xpath.indexOf("queryNode") > -1)
                            this.$executeAction("setValueByXpath", 
                                [xmlNode, res, "."], "setValueByXpath", xmlNode);
                        else 
                            this.$executeAction("setValueByXpath", 
                                [this.xmlRoot, res, xpath], "setValueByXpath", xmlNode);
                    }
                }
            }
            
            if (!oHtml.innerHTML && rule.initial) {
                 oHtml.innerHTML = rule.initial;
                 ppc.setStyleClass(oHtml, "liveEditInitial");
            }
        }

        if (callback)
            $setTimeout(callback);
        
        this.dispatchEvent("$removeEditor", rule);
    }
    
    this.$editors = {
        "default" : {
            create : function(oHtml, rule){
                this.getValue = function(){
                    var html = oHtml.innerHTML.replace(/<br\s*\/?>/g, "\n");
                    if (ppc.isIE) {
                        html = html.replace(/<p[^>]*>/gi, "")
                                   .replace(/<\/P>/g, "")
                                   .replace(/<\/p>/g, "\n");
                    }
                        
                    return ppc.html_entity_decode(html);
                };
                
                if (ppc.hasContentEditable)
                    oHtml.contentEditable = true;
                else {
                    document.body.setAttribute("spellcheck", "false");
                    document.designMode = "on";
                }
                
                if (ppc.isGecko) {
                    try {
                        // On each return, insert a BR element
                        document.execCommand("insertBrOnReturn", false, true);
                    }
                    catch(e){}
                }
            },
            remove : function(oHtml, rule){
                oHtml.blur();
                if (ppc.hasContentEditable)
                    oHtml.contentEditable = false;
                else
                    document.designMode = "off";
            }
        },
        
        /**
         * @todo for template
         *  - Focus handling enters at the first and leaves at the last both entry/leave
         *    are from/to parent element
         *  - Parent focus/blur events aren't called ($focus / $blur should use event system)
         *  - Keyboard events for leave (both ends) are forwarded to parent
         *  - Attach manages height of container
         *  - Attach code / Detach code
         */
        "custom" : {
            create : function(oHtml, rule, xpath){
                //Set window container to notify that this element will contain sub aml element.
                if (this.$isWindowContainer != -1) {
                    this.$isWindowContainer = -1; 
                    ppc.window.$removeFocus(this);
                    ppc.window.$addFocus(this, this.tabindex);
                }
                
                delete this.getValue;
                
                //@todo cache it
                oHtml.innerHTML = "";
                
                var editParent = oHtml;
                var oEditor, editor = rule.editor;
                if (editor.charAt(0) == "<") {
                    //template from aml
                }
                //Lookup
                else if (self[editor]) {
                    oEditor = self[editor];
                    oHtml.appendChild(oEditor.$ext);
                }
                //Reference to class
                else if (ppc.namespaces[ppc.ns.aml].elements[editor]) {
                    var cacheId = JSON.stringify(rule); //Using full element definition as cache id. @todo when should I clear this cache? - at least at destroy - same for propedit/datagrid
                    if (!this.$editorCache)
                        this.$editorCache = {};
                    
                    if (!this.$editorCache[cacheId]) {
                        if (!this.id)
                            ppc.setReference(this.id = (this.localName || "liveedit") + String(this.$uniqueId), this);

                        var _self     = this;
                        var constr    = ppc.namespaces[ppc.ns.aml].elements[editor];
                        var isTextbox = "textarea|textbox|secret".indexOf(editor) > -1;
                        var info      = ppc.extend({
                            htmlNode   : editParent,
                            //width      : "100%+2",
                            //height     : 19,
                            //display:inline-block;
                            style      : "position:relative;", //z-index:10000
                            value      : "[{" + this.id + ".root}::" + xpath + "]",
                            focussable : false,
                            realtime   : "{" + this.id + ".realtime}",
                            onbeforeselect : function(){
                                _self.$skipChange = true;
                            },
                            onafterselect  : function(){
                                delete _self.$skipChange;
                            },
                            onkeydown      : function(e){
                                keydownHandler.call(_self, e);
                            }
                        }, rule);
                        if (info.initial) {
                            info["initial-message"] = info.initial;
                            delete info.initial;
                        }

                        if (isTextbox) {
                            info.focusselect = true;
                            info.onkeydown   = function(e){
                                if (e.keyCode == 13)
                                    this.change(this.getValue());
                            }
                        }
                        else if (editor == "checkbox" && !info.values)
                            info.values = "true|false";
                        
                        //@todo copy all non-known properties of the prop element
        
                        /*if (constr.prototype.hasFeature(ppc.__MULTISELECT__)) {
                            info.caption   = "[text()]";
                            info.eachvalue = "[@value]";
                            info.each      = "item";
                            info.model     = "{ppc.xmldb.getElementById('" 
                                + prop.getAttribute(ppc.xmldb.xmlIdTag) + "')}";
                        }*/
        
                        oEditor = this.$editorCache[cacheId] = new constr(info);
                        
                        /*var box = ppc.getBox(ppc.getStyle(oEditor.$ext, "margin"));
                        if (box[1] || box[3]) {
                            oEditor.setAttribute("width", "100%+2-" + (box[1] + box[3]));
                        }
                        else if (!box[3])
                            oEditor.$ext.style.marginLeft = "-1px";*/
        
                        //oEditor.$focussable = false;
                        /*
                        oEditor.addEventListener("focus", function(){
                            _self.focus();
                            this.$focus();
                        });*/
                        /*oEditor.addEventListener("blur", function(){
                            hideEditor.call(_self);
                        });*/
                        oEditor.parentNode   = this;
                        oEditor.$focusParent = this;
                        oEditor.setAttribute("focussable", "true");
                        //delete oEditor.parentNode;
                        
                        //@todo set actiontracker
                        oEditor.$parentId = editParent.getAttribute("id");
                        oEditor.$parentRsz = editParent.onresize;
                        
                        //Patch oEditor to forward change
                        oEditor.$executeAction = function(atAction, args, action, xmlNode, noevent, contextNode, multiple){
                            if (atAction == "setAttribute" && !args[2])
                                atAction = "removeAttribute";
                            
                            this.parentNode.$executeAction.call(this.parentNode, 
                                atAction, args, action, xmlNode, noevent, contextNode, multiple);
                        }
                    }
                    else {
                        oEditor = this.$editorCache[cacheId];
        
                        /*if (oEditor.hasFeature(ppc.__MULTISELECT__)) {
                            oEditor.setAttribute("model", "{ppc.xmldb.getElementById('" 
                                + prop.getAttribute(ppc.xmldb.xmlIdTag) + "')}");
                        }*/
        
                        oEditor.setAttribute("value", 
                            "[{" + this.id + ".root}::" + xpath + "]");
        
                        oEditor.setProperty("visible", true);
                        if (oEditor.$ext.parentNode 
                          && oEditor.$ext.parentNode.nodeType == 1
                          && !ppc.hasSingleResizeEvent) {
                            if (!oEditor.$parentRsz) 
                                oEditor.$parentRsz = oEditor.$ext.parentNode.onresize;
                            oEditor.$ext.parentNode.removeAttribute("id");
                            delete oEditor.$ext.parentNode.onresize;
                        }
        
                        editParent.appendChild(oEditor.$ext);
                        if (editParent.$parentId)
                            editParent.setAttribute("id", editParent.$parentId);
                        if (oEditor.$parentRsz && !ppc.hasSingleResizeEvent) {
                            editParent.onresize = oEditor.$parentRsz;
                            editParent.onresize();
                        }
                    }
                    
                    /*setTimeout(function(){
                        oEditor.focus();
                    });*/
                }
                else {
                    throw new Error("Unkown editor: " + editor);
                }
                
                this.$lastEditor = [oEditor]

                /*onkeydown = function(e){
                    if (e.keyCode == 9) {
                        e.currentTarget = null;
                        _self.dispatchEvent("keydown", e, true);
                        return false;
                    }
                };*/
            },
            remove : function(oHtml, rule, xpath){
                var el = this.$lastEditor[0].$ext;
                if (el.parentNode)
                    el.parentNode.removeChild(el);

                delete this.$lastEditor;
                oHtml.innerHTML = xpath.indexOf("queryNode") > -1
                    ? eval(xpath.replace("queryNode", "queryValue")) 
                    : ppc.queryValue(this.xmlRoot.ownerDocument, xpath);//this.$lastValue;
                
                this.focus();
                
                return false;
            }
        }
    };
    
    this.isValid = function(checkRequired){
        //@todo only place for checkRequired
        return true;
    };
    
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
     * 
     */
    this.$visualFocus = function(bNotify) {
        // setting focus to the iframe content, upsets the 'code' plugin
        var bCode = (this.$pluginsActive == "code");
        if (this.$bStandalone && ppc.document.activeElement == this && !bCode) {
            try {
                this.$oWin.focus();
            }
            catch(e) {};
        }
        else if (!this.$bStandalone && this.$activeNode) {
            this.$activeNode.focus();
        }

        if (bCode) {
            this.$notifyAllButtons(ppc.DISABLED);
            this.$notifyButton("code", ppc.SELECTED);
        }
        else if (bNotify)
            this.$notifyAllButtons();
    };
    
    // #ifdef __ENABLE_LIVEEDIT_RICHTEXT || __INC_ALL
    ppc.LiveEdit.richtext.call(this);
    // #endif
};

ppc.config.$inheritProperties["liveedit"] = 2;

ppc.LiveEdit.mousedown = function(oHtml, event){
    if (oHtml.$ext) {
        var amlNode = ppc.findHost(oHtml.$ext);
        var lm      = amlNode.ownerDocument.$parentNode;
        if (!lm.hasFocus())
            lm.focus();
        lm.$leMouseDown(event, true);
        ppc.stopPropagation(event);
    }
}

// #endif
