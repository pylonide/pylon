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
    /***************************************************************************
     * PRIVATE
     **************************************************************************/
    
    var lastActiveNode, wasFocussable, skipFocusOnce, lastTemplate, lastValue, 
        mouseOver, mouseOut, mouseDown, mouseUp, docklet,
        objectHandles = false,
        tableHandles  = false,
        bStandalone   = false,
        lastPos       = 0,
        activeNode    = null,
        tabStack      = null,
        changeTimer   = null,
        keyupTimer    = null,
        oToolbar      = null,
        oButtons      = {},
        _self         = this;

    this.addEventListener("focus", function(e){
        if (!this.contenteditable || skipFocusOnce && !(skipFocusOnce = false)) {
            lastActiveNode = null;
            return;
        }

        this.setProperty("state", (this.$pluginsActive == "code")
            ? apf.DISABLED
            : apf.OFF);

        if (lastActiveNode && lastActiveNode.parentNode
          || typeof e.shiftKey == "boolean") {
            createEditor(lastActiveNode || (tabStack 
                || initTabStack())[e.shiftKey ? tabStack.length - 1 : 0]);

            if (lastActiveNode && !lastTemplate)
                lastActiveNode.focus();
        }
        lastActiveNode = null;
        
        if (lastTemplate) {
            lastTemplate.childNodes[0].focus();
        }
        else if (activeNode) {
            var node = activeNode;
            setTimeout(function(){
                //_self.$selection.selectNode(node);
                _self.$selection.set();
                node.focus();
            }, 10);
        }
    });
    
    this.addEventListener("blur", function(e){
        if (!this.contenteditable)
            return;
        
        lastActiveNode = activeNode || lastActiveNode;
        if (e.toElement && (e.toElement == docklet || e.toElement.parentNode == lastTemplate)) //@todo should be recursive in refactor 
            return;

        var pParent = apf.popup.last && apf.lookup(apf.popup.last);
        if (pParent && pParent.editor == _self)
            apf.popup.forceHide();

        if (_self.$selection)
            _self.$selection.cache();
        removeEditor(activeNode, true);

        this.setProperty("state", apf.DISABLED);
    });


    this.addEventListener("load", function(){
        if (!this.contenteditable)
            return;

        createEditor(initTabStack()[0]);
    });

    this.addEventListener("xmlupdate", function(){
        tabStack = null; // redraw of editable region, invalidate cache
    });
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
    this.addEventListener("keydown", function(e) {
        if (!this.contenteditable && !bStandalone)
            return;

        e = e || window.event;
        var isDone, found, code = e.which || e.keyCode;
        if (!activeNode && !bStandalone) {
            //F2 starts editing
            if (code == 113) {
                var oNode;
                if (this.$selected) {
                    var nodes = this.$selected.getElementsByTagName("*");
                    for (var i = nodes.length - 1; i >= 0; i--) {
                        if ((nodes[i].className || "").indexOf("contentEditable") > -1) {
                            oNode = nodes[i];
                            break;
                        }
                    }
                }
                
                createEditor(oNode || (tabStack || initTabStack())[0]);
                if (activeNode) {
                    activeNode.focus();
                    _self.$selection.selectNode(activeNode);
                    _self.$selection.collapse();
                    try {
                        _self.$activeDocument.execCommand("SelectAll", false, true);
                    }
                    catch(e) {}
                }
            }

            return;
        }

        if (apf.isIE) {
            switch (code) {
                case 66:  // B
                case 98:  // b
                case 105: // i
                case 73:  // I
                case 117: // u
                case 85:  // U
                //case 86:  // V |_ See onPaste()
                //case 118: // v |  event handler...
                    if ((e.ctrlKey || (apf.isMac && e.metaKey)) && !e.shiftKey
                      && !e.altKey && _self.realtime)
                        _self.change(_self.getValue());
                    break;
                case 8: // backspace
                    found = false;
                    if (_self.$selection.getType() == "Control") {
                        _self.$selection.remove();
                        found = true;
                    }
                    listBehavior.call(_self, e, true); //correct lists, if any
                    if (found)
                        return false;
                    break;
                case 46:
                    listBehavior.call(_self, e, true); //correct lists, if any
                    break;
                case 9: // tab
                    if (listBehavior.call(_self, e))
                        return false;
                    break;
            }
        }
        else {
            _self.$visualFocus();
            if ((e.ctrlKey || (apf.isMac && e.metaKey)) && !e.shiftKey && !e.altKey) {
                found = false;
                switch (code) {
                    case 66: // B
                    case 98: // b
                        _self.$execCommand("Bold");
                        found = true;
                        break;
                    case 105: // i
                    case 73:  // I
                        _self.$execCommand("Italic");
                        found = true;
                        break;
                    case 117: // u
                    case 85:  // U
                        _self.$execCommand("Underline");
                        found = true;
                        break;
                    case 86:  // V
                    case 118: // v
                        if (!apf.isGecko)
                            onPaste.call(_self);
                        //found = true;
                        break;
                    case 37: // left
                    case 39: // right
                        found = true;
                }
                if (found) {
                    apf.AbstractEvent.stop(e.htmlEvent || e);
                    if (_self.realtime)
                        _self.change(_self.getValue());
                }
            }
        }
        if (!bStandalone && code == 13) { //Enter
            isDone = e.ctrlKey || (apf.isMac && e.metaKey);
            if (!isDone) {
                var model   = this.getModel(),
                    xmlNode = _self.xmlRoot.ownerDocument.selectSingleNode(activeNode.getAttribute("xpath")),
                    rule    = model && model.$validation && model.$validation.getRule(xmlNode) || {multiline: true};
                isDone      = !apf.isTrue(rule.multiline);
            }
        }

        _self.$visualFocus();
        if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
            found = _self.$notifyKeyBindings({
                code   : code,
                control: e.ctrlKey,
                alt    : e.altKey,
                shift  : e.shiftKey,
                meta   : e.metaKey
            });
        }

        // Tab navigation handling
        if (code == 9 || isDone) {
            if (bStandalone) {
                if (listBehavior.call(_self, e.htmlEvent || e)) {
                    apf.AbstractEvent.stop(e.htmlEvent || e);
                    return false;
                }
            }
            else {
                var bShift = e.shiftKey,
                    // a callback is passed, because the call is a-sync
                    lastPos = (tabStack || initTabStack()).indexOf(activeNode),
                    oNode   = removeEditor(activeNode, true) || initTabStack()[lastPos];

                oNode = tabStack[
                    tabStack.indexOf(oNode) + (bShift ? -1 : 1)
                ];

                if (oNode) {
                    createEditor(oNode);
                    if (lastTemplate) {
                        lastTemplate.childNodes[0].focus();
                    }
                    else if (oNode.parentNode) { //lastTemplate
                        oNode.focus();
                        _self.$selection.selectNode(oNode);
                        _self.$selection.collapse();
                        try {
                            _self.$activeDocument.execCommand("SelectAll", false, true);
                        }
                        catch(e) {}
                    }
                    found = true;
                }
            }
        }
        // Esc key handling
        else if (!bStandalone && code == 27) {
            removeEditor(activeNode);
            found = true;
        }
        else if (code == 8 || code == 46) { //backspace or del
            listBehavior.call(_self, e.htmlEvent || e, true); //correct lists, if any
        }

        if (!e.ctrlKey && !e.altKey && (code < 112 || code > 122)
          && (code < 33  && code > 31 || code > 42 || code == 8 || code == 13)) {
            resumeChangeTimer();
        }

        if (found) {
            if (e.preventDefault)
                e.preventDefault();
            if (e.stopPropagation)
                e.stopPropagation();
            e.returnValue = false;
            return false;
        }
        else if (activeNode)
            e.returnValue = -1;
    }, true);

    /**
     * Event handler; fired when the user releases a key inside the editable area
     *
     * @see object.abstractevent
     * @param {Event} e
     * @type  {void}
     * @private
     */
    this.addEventListener("keyup", function(e) {
        if (!this.contenteditable && !bStandalone)
            return;

        if (_self.$selection)
            _self.$selection.cache();
        if (keyupTimer != null)
            return;

        e = e || window.event;

        function keyupHandler() {
            clearTimeout(keyupTimer);
            if (_self.state == apf.DISABLED) return;
            _self.$notifyAllButtons();
            _self.dispatchEvent("typing", {editor: _self, event: e});
            _self.$notifyAllPlugins("typing", e.code);
            keyupTimer = null;
        }

        keyupTimer = window.setTimeout(keyupHandler, 200);
    }, true);

    function createEditor(oNode) {
        if (!oNode || oNode.nodeType != 1 || activeNode == oNode)
            return;

        if (!_self.$selection)
            _self.$selection = new apf.selection(window, document);

        if (activeNode) {
            var lastPos = (tabStack || initTabStack()).indexOf(oNode);
            removeEditor(activeNode, true);
            oNode = initTabStack()[lastPos];
            setTimeout(function(){oNode.focus();}, 10);
        }

        if (_self.validityState && !_self.validityState.valid) {
            oNode = initTabStack()[_self.validityState.$lastPos];
            setTimeout(function(){
                oNode.focus();
                _self.$selection.selectNode(oNode);
                // @todo need to select all contents here?
                _self.$selection.collapse();
                try {
                    _self.$activeDocument.execCommand("SelectAll", false, true);
                }
                catch(e) {}
                _self.getModel().validate(xmlNode, false, _self.validityState, _self);
            }, 10);
        }

        var xmlNode = _self.xmlRoot.ownerDocument.selectSingleNode(oNode.getAttribute("xpath")),
            v, rule;
        if (v = _self.getModel().$validation)
            rule = v.getRule(xmlNode);

        if (!_self.hasFocus())
            skipFocusOnce = true;

        activeNode = oNode;
        apf.setStyleClass(oNode, "contentEditable_active", ["contentEditable_over"]);
        
        // #ifdef __PARSER_HTML
        if (rule && apf.isTrue(rule.richtext)) {
            lastValue = [];
            oNode.innerHTML = lastValue[0] = apf.htmlCleaner.prepare((lastValue[1] = oNode.innerHTML)
                .replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, 
                "<br _apf_marker='1' /><br _apf_marker='1' />"));
            _self.$controlAgentBehavior(oNode);
        }
        else 
        //#endif
            lastValue = oNode.innerHTML;

        /**
         * @todo for template
         *  - Focus handling enters at the first and leaves at the last both entry/leave are from/to parent element
         *  - Parent focus/blur events aren't called ($focus / $blur should use event system)
         *  - Keyboard events for leave (both ends) are forwarded to parent
         *  - Attach manages height of container
         *  - Attach code / Detach code
         */
        if (rule && rule.type == "custom") {
            if (!rule.$template) {
                var nodes = rule.node.childNodes;
                rule.$template = apf.document.appendChild(apf.document.createElement("template"));//todo fix this
                for (var i = 0, l = nodes.length; i < l; i++) {
                    if (nodes[i].nodeType != 1)
                        continue;
                    rule.$template.appendChild(apf.document.createElement(nodes[i]));
                }
            }
            rule.$lastHeight = oNode.style.height;
            rule.$template.attach(oNode, null, true);
            oNode.style.height = (oNode.scrollHeight - apf.getHeightDiff(oNode) + 2) + "px";
            rule.$template.childNodes[0].onblur = function(e){
                if (e.toElement && e.toElement != _self)
                    _self.dispatchEvent("blur");
                else {
                    if (e.toElement)
                        skipFocusOnce = true;
                    else
                        _self.dispatchEvent("blur");
                    _self.focus(null, null, true);
                }
            }
            rule.$template.childNodes[0].onafterchange = function(){  //@todo buggy should be no events in refactor apf3.0
                //skipFocusOnce = true;
                //_self.focus();
            }
            rule.$template.childNodes[0].onkeydown = function(e){
                if (e.keyCode == 9) {
                    e.originalElement = null;
                    _self.dispatchEvent("keydown", e, true);
                    return false;
                }
            }
            rule.$template.childNodes[0].setValue(apf.queryValue(xmlNode));
            //rule.$template.childNodes[0].focus(); //@todo general focus problem for subchildren
            lastTemplate = rule.$template;
            return;
        }
        
        if (apf.hasContentEditable) {
            oNode.contentEditable = true;
        }
        else {
            document.body.setAttribute("spellcheck", "false");
            document.designMode = "on";
        }
        if (apf.isGecko) {
            // On each return, insert a BR element
            document.execCommand("insertBrOnReturn", false, true);
            // Tell Gecko (Firefox 1.5+) to enable or not live resizing of objects
            document.execCommand("enableObjectResizing", false, objectHandles);
            // Disable the standard table editing features of Firefox.
            document.execCommand("enableInlineTableEditing", false, tableHandles);
        }

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

        var showDocklet = rule && apf.isTrue(rule.richtext);
        if (showDocklet && !docklet)
            _self.$editable();
        if (docklet)
            docklet.setProperty("visible", showDocklet);
        _self.setProperty("state", apf.OFF);

        //_self.$selection.cache();
    }

    function removeEditor(oNode, bProcess, callback) {
        if (!oNode) oNode = activeNode;
        if (!oNode || oNode.nodeType != 1) return false;
        
        var model   = _self.getModel(),
            xpath   = oNode.getAttribute("xpath"),
            xmlNode = _self.xmlRoot.ownerDocument.selectSingleNode(xpath),
            v, rule;
        if (v = model.$validation)
            rule = v.getRule(xmlNode);
        
        if (lastTemplate) {
            if (lastTemplate.childNodes.indexOf(apf.window.focussed) > -1)
                _self.focus();
            lastTemplate.detach();
            oNode.innerHTML = lastTemplate.childNodes[0].getValue();
            lastTemplate = null;
            oNode.style.height = rule.$lastHeight;
        }
        else {
            _self.$selection.collapse(true);
            
            if (apf.hasContentEditable)
                oNode.contentEditable = false;
            else
                document.designMode = "off";
        }

        activeNode = null;

        apf.setStyleClass(oNode, null, ["contentEditable_over", "contentEditable_active"]);

        if (docklet)
            docklet.setProperty("visible", false);

        if (!bProcess || lastValue && oNode.innerHTML.toLowerCase().replace(/[\r\n]/g, "") == (lastValue.dataType == "array" ? lastValue[0] : lastValue).toLowerCase().replace(/[\r\n]/g, "")) {
            oNode.innerHTML = lastValue.dataType == "array" ? lastValue[1] : lastValue;
            return false;
        }

        if (_self.validityState)
            _self.validityState.$reset();

        // do additional handling, first we check for a change in the data...
        if (apf.queryValue(_self.xmlRoot.ownerDocument, xpath) != oNode.innerHTML) { //@todo this will not always work in IE
            var lastPos = (tabStack || initTabStack()).indexOf(oNode);

            _self.edit(xmlNode, rule && apf.isTrue(rule.richtext) 
                ? apf.htmlCleaner.parse(oNode.innerHTML)
                : oNode.innerHTML);

            if (v) {
                (_self.validityState || (_self.validityState = 
                    new apf.validator.validityState())).$errorHtml = 
                        (tabStack || initTabStack())[lastPos]

                _self.validityState.$lastPos = lastPos;

                if (rule)
                    _self.invalidmsg = rule.invalidmsg;

                model.validate(xmlNode, false, _self.validityState, _self); //@todo this can be improved later       
            }
        }

        if (callback)
            setTimeout(callback);
    }

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

    /**
     * Turns an object of mapped keystrokes to a numeric representation.
     * Since ASCII numbers of character codes don't go above 255, we start
     * with 256 for modifier keys and shift bits around to the left until we
     * get a unique hash for each key combination.
     *
     * @param {Object} keyMap
     * @type  {Number}
     * @private
     */
    function createKeyHash(keyMap) {
        return (keyMap.meta ? 2048 : 0) | (keyMap.control ? 1024 : 0)
            |  (keyMap.alt  ? 512  : 0) | (keyMap.shift   ? 256  : 0)
            |  (keyMap.key || "").charCodeAt(0);
    }

    /**
     * Transform the state of a button node to "enabled"
     *
     * @type {void}
     * @private
     */
    function buttonEnable() {
        apf.setStyleClass(this, "editor_enabled",
            ["editor_selected", "editor_disabled"]);
        this.disabled = false;
    }

    /**
     * Transform the state of a button node to "disabled"
     *
     * @type {void}
     * @private
     */
    function buttonDisable() {
        apf.setStyleClass(this, "editor_disabled",
            ["editor_selected", "editor_enabled"]);
        this.disabled = true;
    }

    /**
     * Retrieve the state of a command and if the command is a plugin, retrieve
     * the state of the plugin
     *
     * @param  {String}  id
     * @param  {Boolean} isPlugin
     * @return The command state as an integer that maps to one of the editor state constants
     * @type   {Number}
     * @private
     */
    function getState(id, isPlugin) {
        if (isPlugin) {
            var plugin = _self.$plugins[id];
            if (_self.state == apf.DISABLED && !plugin.noDisable)
                return apf.DISABLED;
            return plugin.queryState
                ? plugin.queryState(_self)
                : _self.state;
        }

        if (_self.state == apf.DISABLED)
            return apf.DISABLED;

        return _self.$queryCommandState(id);
    }

    /**
     * Corrects the default/ standard behavior of list elements (&lt;ul&gt; and
     * &lt;ol&gt; HTML nodes) to match the general user experience match with
     * M$ Office Word.
     *
     * @param {Event}   e
     * @param {Boolean} bFix Flag set to TRUE if you want to correct list indentation
     * @type Boolean
     * @private
     */
    function listBehavior(e, bFix) {
        if (!this.$plugins["bullist"] || !this.$plugins["numlist"])
            return false;
        if (typeof e.shift != "undefined")
           e.shiftKey = e.shift;
        var pList = this.$plugins["bullist"].queryState(this) == apf.ON
            ? this.$plugins["bullist"]
            : this.$plugins["numlist"].queryState(this) == apf.ON
                ? this.$plugins["numlist"]
                : null;
        if (!pList) return false;
        if (bFix === true)
            pList.correctLists(this);
        else
            pList.correctIndentation(this, e.shiftKey ? "outdent" : "indent");

        return true;
    }

    /**
     * Firing change(), when the editor is databound, subsequently after each
     * keystroke, can have a VERY large impact on editor performance. That's why
     * we delay the change() call.
     *
     * @type {void}
     */
    function resumeChangeTimer() {
        if (!_self.realtime || changeTimer !== null) return;
        changeTimer = setTimeout(function() {
            clearTimeout(changeTimer);
            _self.change(_self.getValue());
            changeTimer = null;
        }, 200);
    }

    /***************************************************************************
     * PROTECTED
     **************************************************************************/

    this.$regbase        = this.$regbase | __CONTENTEDITABLE__;
    this.$activeDocument = document;
    this.$state          = apf.ON;
    this.$selection      = null;
    this.$buttons        = ["Bold", "Italic", "Underline"];
    this.$classToolbar   = "editor_Toolbar";
    this.$plugins        = {};
    this.$pluginsHooks   = {};
    this.$pluginsTypes   = {};
    this.$pluginsKeys    = [];
    this.$pluginsActive  = null;
    this.$pluginsOn      = ["pasteword", "tablewizard"];
    this.$nativeCommands = ["bold", "italic", "underline", "strikethrough",
                            "justifyleft", "justifycenter", "justifyright",
                            "justifyfull", "removeformat", "cut", "copy",
                            "paste", "outdent", "indent", "undo", "redo"];

    this.$supportedProperties.push("contenteditable", "state", "plugins",
        "realtime", "language");
    this.$booleanProperties["contenteditable"] = true;
    this.$booleanProperties["realtime"]        = true;
    this.$propHandlers["contenteditable"]      = function(value){
        if (apf.isTrue(value)) {
            apf.addListener(_self.oExt, "mouseover", mouseOver = function(e) {
                var el = e.srcElement || e.target;
                if (!el) return;
                while (el && (!el.className || el.className.indexOf("contentEditable") == -1) && el != _self.oExt) {
                    el = el.parentNode;
                }
                if (!el || el == _self.oExt || el == activeNode) 
                    return;
                apf.setStyleClass(el, "contentEditable_over");
            });
            apf.addListener(_self.oExt, "mouseout",  mouseOut = function(e) {
                var el = e.srcElement || e.target;
                if (!el) return;
                while (el && (!el.className || el.className.indexOf("contentEditable") == -1) && el != _self.oExt) {
                    el = el.parentNode;
                }
                if (!el || el == _self.oExt || el == activeNode) 
                    return;
                apf.setStyleClass(el, null, ["contentEditable_over"]);
            });
            apf.addListener(_self.oExt, "mousedown", mouseDown = function(e) {
                var el = e.srcElement || e.target;
                if (!el) return;
                if (activeNode && _self.$selection && apf.isChildOf(activeNode, el, true))
                    _self.$selection.cache();
                
                while (el && (!el.className || el.className.indexOf("contentEditable") == -1) && el != _self.oExt) {
                    el = el.parentNode;
                }
                
                if (!el || el == _self.oExt) {
                    if (activeNode)
                        removeEditor(activeNode, true);
                    return;
                }

                createEditor(el);
                if (!lastTemplate) {
                    e.cancelBubble = true;
                    apf.window.$mousedown({srcElement: activeNode});
                    setTimeout(function(){
                        //@todo Mike. The cursor position is lost!!! Please help me!
                        _self.$selection.set();
                        if (activeNode)
                            activeNode.focus();
                    }, 10);
                }
                else {
                    setTimeout(function(){
                        lastTemplate.childNodes[0].focus();
                    }, 100);
                    lastTemplate.childNodes[0].slideDown();
                }
                
                return false;
            });
            apf.addListener(_self.oExt, "mouseup", mouseUp = function(e) {
                var el = e.srcElement || e.target;
                if (activeNode && _self.$selection && apf.isChildOf(activeNode, el, true))
                    _self.$selection.cache();
            });

            wasFocussable = [this.$focussable, 
                typeof this.focussable == "undefined" ? true : this.focussable];
            this.$focussable = true;
            this.setProperty("focussable", true);
        }
        else {
            apf.removeListener(_self.oExt, "mouseover", mouseOver);
            apf.removeListener(_self.oExt, "mouseout",  mouseOut);
            apf.removeListener(_self.oExt, "mousedown", mouseDown);
            apf.removeListener(_self.oExt, "mouseup",   mouseUp);

            this.$focussable = wasFocussable[0];
            this.setProperty("focussable", wasFocussable[1]);
        }

        tabStack = null; // redraw of editable region, invalidate cache
        this.reload();
    };

    this.$propHandlers["state"] = function(value){
        this.state = parseInt(value); // make sure it's an int
        // the state has changed, update the button look/ feel
        setTimeout(function() {
            _self.$notifyAllButtons(value);
            if (_self.$pluginsActive == "code")
                _self.$notifyButton("code", apf.SELECTED);
        });
    };

    this.$propHandlers["plugins"] = function(value){
        this.$pluginsOn = value && value.splitSafe(value) || null;
        if (this.$pluginsOn && this.$pluginsOn.length) {
            for (var i = 0, l = this.$pluginsOn.length; i < l; i++)
                this.$addPlugin(this.$pluginsOn[i]);
        }
    };

    /**
     * @attribute {Boolean} realtime whether the value of the bound data is
     * updated as the user types it, or only when this element looses focus or
     * the user presses enter.
     */
    this.$propHandlers["realtime"] = function(value){
        this.realtime = typeof value == "boolean"
            ? value
            : apf.getInheritedAttribute(this.$aml, "realtime") || false;
    };

    this.$propHandlers["language"] = function(value){
        // @todo implement realtime language switching
    };

    /**
     * Get the state of a command (on, off or disabled)
     *
     * @param {String} name
     * @type Number
     */
    this.$queryCommandState = function(name) {
        if (apf.isGecko && (name == "paste" || name == "copy" || name == "cut"))
            return apf.DISABLED;
        try {
            if (!this.$activeDocument.queryCommandEnabled(name))
                return apf.DISABLED;
            else
                return this.$activeDocument.queryCommandState(name)
                    ? apf.ON
                    : apf.OFF;
        }
        catch (e) {
            return apf.OFF;
        }
    };

    /**
     * Get the value of a command
     *
     * @param {String} name
     * @type Number
     */
    this.$queryCommandValue = function(name) {
        var val;
        try {
            val = this.$activeDocument.queryCommand(name);
        }
        catch (e) {}

        return val || null;
    };

    /**
     * Issue a command to the editable area.
     *
     * @param {String} name
     * @param {mixed}  param
     * @type  {void}
     */
    this.$execCommand = function(name, param) {
        if (this.$plugins[name] || this.state == apf.DISABLED)
            return;

        this.$selection.set();
        
        this.$visualFocus();

        if (name.toLowerCase() == "removeformat") {
            var c          = this.$selection.getContent(),
                disallowed = {FONT: 1, SPAN: 1, H1: 1, H2: 1, H3: 1, H4: 1,
                H5: 1, H6: 1, PRE: 1, ADDRESS: 1, BLOCKQUOTE: 1, STRONG: 1,
                B: 1, U: 1, I: 1, EM: 1, LI: 1, OL: 1, UL: 1, DD: 1, DL: 1,
                DT: 1};
            c = c.replace(/<\/?(\w+)(?:\s.*?|)>/g, function(m, tag) {
                return !disallowed[tag] ? m : "";
            });
            if (apf.isIE) {
                var htmlNode = this.$selection.setContent("<div>" + c
                    + "</div>");
                this.$selection.selectNode(htmlNode);
                htmlNode.removeNode(false);
                return;
            }
            else {
                this.$selection.setContent(c);
            }
        }

        this.$activeDocument.execCommand(name, false, param);

        // make sure that the command didn't leave any <P> tags behind (cleanup)
        name       = name.toLowerCase();
        var bNoSel = (name == "selectall");
        if (apf.isIE) {
            if ((name == "insertunorderedlist" || name == "insertorderedlist")
              && this.$queryCommandState(name) == apf.OFF) {
                bNoSel = true;
            }
            else if (name == "outdent") {
                bNoSel = true;
                if (this.$plugins["bullist"] && this.$plugins["numlist"]) {
                    if (this.$plugins["bullist"].queryState(_self) != apf.OFF
                     && this.$plugins["numlist"].queryState(_self) != apf.OFF)
                        bNoSel = false;
                }
                var oNode = this.$selection.getSelectedNode();
                if (bNoSel && oNode && oNode.tagName == "BLOCKQUOTE")
                    bNoSel = false;
            }

            if (bNoSel) {
                var el = bStandalone ? this.$activeDocument.body : activeNode;
                //#ifdef __PARSER_HTML
                el.innerHTML = apf.htmlCleaner.prepare(el.innerHTML);
                //#endif
                this.$controlAgentBehavior(el);
            }
            var r = this.$selection.getRange();
            if (r)
                r.scrollIntoView();
        }

        this.$notifyAllButtons();
        this.change(this.getValue());

        setTimeout(function() {
            //_self.$notifyAllButtons(); // @todo This causes pain, find out why
            if (!bNoSel)
               _self.$selection.set();
            _self.$visualFocus();
        });
    };

    /**
     * Add a plugin to the collection IF an implementation actually exists.
     *
     * @param {String} sPlugin The plugin identifier/ name
     * @type  {apf.ContentEditable.plugin}
     */
    this.$addPlugin = function(sPlugin) {
        if (this.$plugins[sPlugin])
            return this.$plugins[sPlugin];
        if (!apf.ContentEditable.plugin[sPlugin]) return null;
        // yay, plugin does exist, so we can instantiate it for the editor
        var plugin = new apf.ContentEditable.plugin[sPlugin](sPlugin);
        // add it to main plugin collection
        this.$plugins[plugin.name] = plugin;

        if (plugin.type) {
            // a type prop is set, push it up the type-collection
            if (!this.$pluginsTypes[plugin.type])
                this.$pluginsTypes[plugin.type] = [];
            this.$pluginsTypes[plugin.type].push(plugin);
        }
        if (plugin.subType) {
            // a subType prop is set, push it up the type-collection
            if (!this.$pluginsTypes[plugin.subType])
                this.$pluginsTypes[plugin.subType] = [];
            this.$pluginsTypes[plugin.subType].push(plugin);
        }
        if (plugin.hook) {
            // a hook prop is set, push it up the event hooks-collection
            plugin.hook = plugin.hook.toLowerCase();
            if (!this.$pluginsHooks[plugin.hook])
                this.$pluginsHooks[plugin.hook] = [];
            this.$pluginsHooks[plugin.hook].push(plugin);
        }

        if (typeof plugin.keyBinding == "string") {
            // a keyBinding prop has been set, parse it and push it up the
            // keys-collection
            plugin.keyBinding = {
                meta   : (plugin.keyBinding.indexOf("meta")  > -1),
                control: (plugin.keyBinding.indexOf("ctrl")  > -1),
                alt    : (plugin.keyBinding.indexOf("alt")   > -1),
                shift  : (plugin.keyBinding.indexOf("shift") > -1),
                key    : plugin.keyBinding.charAt(plugin.keyBinding.length - 1).toLowerCase()
            };
            plugin.keyHash = createKeyHash(plugin.keyBinding);
            if (!this.$pluginsKeys[plugin.keyHash])
                this.$pluginsKeys[plugin.keyHash] = [];
            this.$pluginsKeys[plugin.keyHash].push(plugin);
        }
        return plugin;
    };

    /**
     * Notify a plugin of any occuring Event, if it has subscribed to it
     *
     * @param {String} name
     * @param {String} hook
     * @type  {mixed}
     */
    this.$notifyPlugin = function(name, hook) {
        var item = this.$plugins[name];
        if (item && item.hook == hook && !item.busy)
            return item.execute(this, arguments);
        return null;
    };

    /**
     * Notify all plugins of an occuring Event
     *
     * @param {String} hook
     * @param {Event}  e
     * @type  {Array}
     */
    this.$notifyAllPlugins = function(hook, e) {
        var res = [];
        if (!this.$pluginsHooks)
            return res;

        var coll = this.$pluginsHooks[hook];
        for (var i in coll) {
            if (!coll[i].busy && coll[i].execute)
                res.push(coll[i].execute(this, e));
        }
        //this.active = res.length ? res : res[0];
        return res;
    };

    /**
     * Notify all plugins of an occuring keyboard Event with a certain key combo
     *
     * @param {Object} keyMap
     * @type  {Array}
     */
    this.$notifyKeyBindings = function(keyMap) {
        var hash = createKeyHash(keyMap);
        if (!this.$pluginsKeys[hash] || !this.$pluginsKeys[hash].length)
            return false;

        var coll = this.$pluginsKeys[hash];
        for (var i = 0, j = coll.length; i < j; i++)
            coll[i].execute(this, arguments);
        //this.active = coll.length ? coll : coll[0];
        return true;
    };

    /**
     * Notify a specific button item on state changes (on, off, disabled, visible or hidden)
     *
     * @param {String} item
     * @param {Number} state Optional.
     * @type  {void}
     */
    this.$notifyButton = function(item, state) {
        if (!this.$plugins) //We're in the process of being destroyed
            return;

        var oButton = oButtons[item];
        if (!oButton)
            return;

        var oPlugin = this.$plugins[item];
        if (typeof state == "undefined" || state === null) {
            if (oPlugin && oPlugin.queryState)
                state = oPlugin.queryState(this);
            else
                state = this.$queryCommandState(item);
        }

        if (oButton.state === state)
            return;

        oButton.state = state;

        if (state == apf.DISABLED)
            buttonDisable.call(oButton);
        else if (state == apf.HIDDEN)
            oButton.style.display = "none";
        else if (state == apf.VISIBLE)
            oButton.style.display = "";
        else {
            if (oButton.style.display == "none")
                oButton.style.display = "";

            if (oButton.disabled)
                buttonEnable.call(oButton);

            var btnState = (oButton.selected)
                ? apf.ON
                : apf.OFF;

            if (state != btnState) {
                this.$buttonClick({
                    state   : state,
                    isPlugin: oPlugin ? true : false,
                    _bogus  : true
                }, oButton);
            }
        }
    };

    /**
     * Notify all button items on state changes (on, off or disabled)
     *
     * @param {Number} state Optional.
     * @type  {void}
     */
    this.$notifyAllButtons = function(state) {
        for (var item in oButtons)
            this.$notifyButton(item, state);
    };

    /**
     * Give or return the focus to the editable area, hence 'visual' focus.
     *
     * @param {Boolean} bNotify Flag set to TRUE if plugins should be notified of this event
     * @type  {void}
     */
    this.$visualFocus = function(bNotify) {
        // setting focus to the iframe content, upsets the 'code' plugin
        var bCode = (this.$pluginsActive == "code");
        if (bStandalone && apf.window.focussed == this && !bCode) {
            try {
                this.oWin.focus();
            }
            catch(e) {};
        }
        else if (!bStandalone && activeNode) {
            activeNode.focus();
        }

        if (bCode) {
            this.$notifyAllButtons(apf.DISABLED);
            this.$notifyButton("code", apf.SELECTED);
        }
        else if (bNotify)
            this.$notifyAllButtons();
    };

    /**
     * Handler function; invoked when a toolbar button node was clicked
     *
     * @see object.abstractevent
     * @param {Event}      e
     * @param {DOMElement} oButton
     * @type  {void}
     */
    this.$buttonClick = function(e, oButton) {
        _self.$selection.cache();

        apf.setStyleClass(oButton, "active");
        var item = oButton.getAttribute("type");

        //context 'this' is the buttons' DIV domNode reference
        if (!e._bogus) {
            e.isPlugin = _self.$plugins[item] ? true : false;
            e.state    = getState(item, e.isPlugin);
        }

        if (e.state == apf.DISABLED) {
            buttonDisable.call(oButton);
        }
        else {
            if (this.disabled)
                buttonEnable.call(oButton);

            if (e.state == apf.ON) {
                apf.setStyleClass(oButton, "editor_selected");
                oButton.selected = true;
            }
            else {
                apf.setStyleClass(oButton, "", ["editor_selected"]);
                oButton.selected = false;
            }

            if (!e._bogus) {
                if (e.isPlugin)
                    _self.$plugins[(_self.$pluginsActive = item)].execute(_self);
                else
                    _self.$execCommand(item);
                e.state = getState(item, e.isPlugin);
            }
        }
        apf.setStyleClass(oButton, "", ["active"]);
    };

    /**
     * Draw all HTML elements for the editor toolbar
     *
     * @param {HTMLElement} oParent     DOM element which the toolbars should be inserted into
     * @param {String}      [sSkinTag]  Tagname of a toolbar node inside the editor skin definition
     * @param {String}      [sBtnClick] JS that will be executed when a button node is clicked
     * @type  {void}
     */
    this.$drawToolbars = function(oParent, sSkinTag, sBtnClick, bAfterRender) {
        var tb, l, k, i, j, z, x, node, buttons, bIsPlugin, item, bNode,
            plugin, oButton,
            sButton = bStandalone ? "button" : "toolbarbutton",
            oNode   = docklet.$getOption("toolbars"),
            plugins = this.$plugins;

        if (!sSkinTag)
            sSkinTag = "toolbar";

        for (i = 0, l = oNode.childNodes.length; i < l; i++) {
            node = oNode.childNodes[i];
            if (node.nodeType != 1 || node[apf.TAGNAME] != sSkinTag)
                continue;

            //#ifdef __DEBUG
            /*if (node[apf.TAGNAME] != "toolbar") {
                throw new Error(apf.formatErrorString(0, this,
                    "Creating toolbars",
                    "Invalid element found in toolbars definition",
                    node));
            }*/
            //#endif

            for (j = 0, k = node.childNodes.length; j < k; j++) {
                bNode = node.childNodes[j];

                //#ifdef __DEBUG;
                if (bNode.nodeType != 3 && bNode.nodeType != 4) {
                    throw new Error(apf.formatErrorString(0, this,
                        "Creating toolbars",
                        "Invalid element found in toolbar definition",
                        bNode));
                }
                //#endif

                buttons = bNode.nodeValue.splitSafe(",", -1, true);
            }

            if (!buttons || !buttons.length)
                continue;

            docklet.$getNewContext("toolbar");
            tb = bAfterRender
                ? apf.xmldb.htmlImport(docklet.$getLayoutNode("toolbar"), oParent)
                : oParent.appendChild(docklet.$getLayoutNode("toolbar"));//, oParent.lastChild

            for (z = 0, x = buttons.length; z < x; z++) {
                item = buttons[z];

                if (item == "|") { //seperator!
                    docklet.$getNewContext("divider");
                    if (bAfterRender)
                        apf.xmldb.htmlImport(docklet.$getLayoutNode("divider"), tb);
                    else
                        tb.appendChild(docklet.$getLayoutNode("divider"));
                }
                else {
                    docklet.$getNewContext(sButton);
                    oButton = bAfterRender
                        ? oButton = apf.xmldb.htmlImport(docklet.$getLayoutNode(sButton), tb)
                        : oButton = tb.appendChild(docklet.$getLayoutNode(sButton));

                    bIsPlugin = false;
                    // Plugin toolbarbuttons may only be placed inside the main toolbar
                    if (sSkinTag == "toolbar" && !this.$nativeCommands.contains(item)) {
                        plugin = this.$addPlugin(item);
                        // #ifdef __DEBUG
                        if (!plugin)
                            apf.console.error("Plugin '" + item + "' can not \
                                               be found and/ or instantiated.",
                                               "editor");
                        // #endif
                        bIsPlugin = true;
                    }

                    if (bIsPlugin) {
                        plugin = plugin || plugins[item];
                        if (!plugin)
                            continue;
                        if (!(plugin.type & apf.TOOLBARITEM))
                            continue;

                        docklet.$getLayoutNode(sButton, "label", oButton)
                            .setAttribute("class", "editor_icon editor_" + plugin.icon);

                        oButton.setAttribute("title", this.$translate(plugin.name));
                    }
                    else {
                        docklet.$getLayoutNode(sButton, "label", oButton)
                            .setAttribute("class", "editor_icon editor_" + item);

                        oButton.setAttribute("title", this.$translate(item));
                    }

                    oButton.setAttribute("onmousedown", sBtnClick || "apf.all["
                        + _self.uniqueId + "].$buttonClick(event, this);");
                    oButton.setAttribute("onmouseover", "apf.setStyleClass(this, 'hover');");
                    oButton.setAttribute("onmouseout", "apf.setStyleClass(this, '', ['hover']);");

                    oButton.setAttribute("type", item);
                }
            }

            buttons = null;
        }

        if (apf.isIE) {
            var nodes = oParent.getElementsByTagName("*");
            for (i = nodes.length - 1; i >= 0; i--)
                nodes[i].setAttribute("unselectable", "On");
        }
    };

    this.$editable = function(callback) {
        if (this.$aml.getAttribute("plugins")) {
            this.$propHandlers["plugins"]
                .call(this, this.$aml.getAttribute("plugins"));
        }
        if (this.$aml.getAttribute("language")) {
            this.$propHandlers["language"]
                .call(this, this.$aml.getAttribute("language"));
        }

        // no External representation yet, which means that we're dealing with
        // a full-mode editor.
        if (!this.oExt) {
            docklet     = this;
            bStandalone = true;
            
            this.oExt = this.$getExternal("main", null, function(oExt){
                this.$drawToolbars(this.$getLayoutNode("main", "toolbar"));
            });
            oToolbar = this.oToolbar = this.$getLayoutNode("main", "toolbar", this.oExt);
        }
        else if (!docklet && !(apf.ContentEditable.toolwin = docklet)) {
            docklet = apf.ContentEditable.toolwin = 
                new apf.modalwindow(document.body, "toolwindow");

            docklet.parentNode = apf.document.documentElement;
            docklet.implement(apf.AmlDom);
            
            //Load docklet
            docklet.$aml        = apf.getXml("<toolwindow />");
            //docklet.skinset   = apf.getInheritedAttribute(_self.$aml.parentNode, "skinset"); //@todo use skinset here. Has to be set in presentation
            //xmlNode.setAttribute("skinset", docklet.skinset);
            //docklet.skin      = "docklet";
            //docklet.skinName  = null;
            docklet.$loadSkin();

            docklet.$draw();
            docklet.setProperty("buttons", "");
            docklet.setProperty("title", "Formatting");
            docklet.setProperty("icon", "application.png");
            docklet.setProperty("resizable", "horizontal");
            docklet.setProperty("draggable", true);
            docklet.setProperty("focussable", true);
            //docklet.setProperty("resizeoutline", true);

            docklet.onfocus = function(){
                _self.focus();
            }

            apf.AmlParser.parseLastPass();

            docklet.setProperty("left", 500);
            docklet.setProperty("top", 100);
            docklet.setProperty("width", 400);
            
            var content, aNodes = docklet.oExt.getElementsByTagName("div");
            for (var j = 0, l = aNodes.length; j < l && !content; j++) {
                if (aNodes[j].className.indexOf("content") != -1)
                    content = aNodes[j];
            }
            this.$drawToolbars(oToolbar = content, "toolbar", null, true);
            // @todo make this hack disappear...
            oToolbar.innerHTML = oToolbar.innerHTML;
        }

        if (callback)
            callback.call(this);

        if (oToolbar) {
            // fetch the DOM references of all toolbar buttons and let the
            // respective plugins finish initialization
            var btns = oToolbar.getElementsByTagName("div");
            for (var item, plugin, i = btns.length - 1; i >= 0; i--) {
                item = btns[i].getAttribute("type");
                if (!item) continue;

                oButtons[item] = btns[i];
                plugin = this.$plugins[item];
                if (!plugin) continue;

                plugin.buttonNode = btns[i];

                if (plugin.init)
                    plugin.init(this);
            }
        }
    };

    this.$getPluginOption = function(node) {
        return docklet.$getOption(node);
    };

    /**
     * Make an instance of apf.popup (identified with a pointer to the cached
     * DOM node - sCacheId) visible to the user.
     *
     * @param {apf.ContentEditable.plugin} oPlugin  The plugin instance
     * @param {String}            sCacheId Pointer to the cached DOM node
     * @param {DOMElement}        oRef     Button node to show popup below to
     * @param {Number}            iWidth   New width of the popup
     * @param {Number}            iHeight  New height of the popup
     * @type  {void}
     */
    this.$showPopup = function(oPlugin, sCacheId, oRef, iWidth, iHeight) {
        if (apf.popup.last && apf.popup.last != sCacheId) {
            var o = apf.lookup(apf.popup.last);
            if (o) {
                o.state = apf.OFF;
                this.$notifyPlugin(o.name, o.state);
            }
        }

        //this.$selection.cache();
        this.$selection.set();
        if (this.$visualFocus)
            this.$visualFocus();

        oPlugin.state = apf.ON;
        this.$notifyPlugin(oPlugin.name, apf.ON);

        if (apf.popup.isShowing(sCacheId))
            return;

        // using setTimeout here, because I want the popup to be shown AFTER the
        // event bubbling is complete. Another click handler further up the DOM
        // tree may call a apf.popup.forceHide();
        setTimeout(function() {
            apf.popup.show(sCacheId, {
                x        : 0,
                y        : 22,
                animate  : false,
                ref      : oRef,
                width    : iWidth,
                height   : iHeight,
                callback : function(oPopup) {
                    if (oPopup.onkeydown) return;
                    oPopup.onkeydown = function(e) {
                        e = e || window.event;
                        var key = e.which || e.keyCode;
                        if (key == 13 && typeof oPlugin["submit"] == "function") //Enter
                            return oPlugin.submit(new apf.AbstractEvent(e));
                    }
                }
            });
        });
    };

    /**
     * Returns the translated key from a locale pack/ collection
     *
     * @param {String}  key
     * @param {Boolean} bIsPlugin
     * @type  {String}
     * @private
     */
    this.$translate = function(key, bIsPlugin) {
        // #ifdef __DEBUG
        if ((!bIsPlugin && !apf.ContentEditable.i18n[_self.language][key])
          || (bIsPlugin && !apf.ContentEditable.i18n[_self.language]["plugins"][key]))
            apf.console.error("Translation does not exist"
                + (bIsPlugin ? " for plugin" : "") + ": " + key);
        // #endif

        return bIsPlugin
            ? apf.ContentEditable.i18n[_self.language]["plugins"][key]
            : apf.ContentEditable.i18n[_self.language][key];
    };

    /**
     * Inserts any given text (or HTML) at cursor position into the Editor
     *
     * @param {String}  html
     * @param {Boolean} [bNoParse] Prevents parsing the HTML, which might alter the string
     * @param {Boolean} [bNoFocus] Prevents setting the focus back to the editor area
     * @type  {void}
     */
    this.$insertHtml = function(html, bNoParse, bNoFocus) {
        //removed check: if (inited && complete)
        if (!bNoFocus)
            this.$selection.set();
        this.$visualFocus(true);
        // #ifdef __PARSER_HTML
        html = bNoParse ? html : apf.htmlCleaner.prepare(html);
        // #endif
        this.$selection.setContent(html, true);
        // notify SmartBindings that we changed stuff...
        this.change(this.getValue());

        if (bNoFocus) return;
        setTimeout(function() {
            _self.$selection.set();
            _self.$visualFocus();
        });
    };

    /**
     * Corrects the default/ standard behavior of user agents that do not match
     * our intentions or those of the user.
     *
     * @param {DOMElement} oParent ContentEditable element
     * @type  void
     * @private
     */
    this.$controlAgentBehavior = function(oParent) {
        if (apf.isGecko) {
            //var oParent = this.$activeDocument.body;
            var oNode;
            while (oParent.childNodes.length) {
                oNode = oParent.firstChild;
                if (oNode.nodeType == 1) {
                    if (oNode.nodeName == "BR"
                      && oNode.getAttribute("_moz_editor_bogus_node") == "TRUE") {
                        _self.$selection.selectNode(oNode);
                        _self.$selection.remove();
                        _self.$selection.collapse(false);
                        break;
                    }
                }
                oParent = oNode;
            }
        }
        else if (apf.isSafari) {
            _self.$activeDocument.designMode = "on";
        }
        else if (apf.isIE) {
            // yes, we fix hyperlinks...%&$#*@*!
            var s, aLinks = oParent.getElementsByTagName("a");
            for (var i = 0, j = aLinks.length; i < j; i++) {
                s = aLinks[i].getAttribute("_apf_href");
                if (s) { //prefix 'http://' if it's not there yet...
                    aLinks[i].href = (s.indexOf("http://") == -1
                        ? "http://" : "") + s;
                }
            }
        }
    };

    /***************************************************************************
     * PUBLIC
     **************************************************************************/

    this.language = "en_GB";//"nl_NL";
    this.state    = apf.OFF;

    this.edit = function(xmlNode, value) {
        this.executeActionByRuleSet("edit", "edit", xmlNode, value);
    }
};

apf.ON             = 1;
apf.OFF            = 0;
apf.DISABLED       = -1;
apf.VISIBLE        = 2;
apf.HIDDEN         = 3;
apf.SELECTED       = 4;

apf.ContentEditable.i18n = {
    "en_GB": {
        "cancel": "Cancel",
        "insert": "Insert",
        "bold": "Bold",
        "italic": "Italic",
        "underline": "Underline",
        "strikethrough": "Strikethrough",
        "justifyleft": "Align text left",
        "justifycenter": "Center",
        "justifyright": "Align text right",
        "justifyfull": "Justify",
        "removeformat": "Clear formatting",
        "cut": "Cut",
        "copy": "Copy",
        "paste": "Paste",
        "outdent": "Decrease indent",
        "indent": "Increase indent",
        "undo": "Undo",
        "redo": "Redo",
        // plugin keys:
        "anchor": "Insert anchor",
        "blockquote": "Blockquote",
        "charmap": "Character map",
        "code": "HTML source view",
        "listitem": "List item",
        "nbsp": "Non-breaking space",
        "break": "Linebreak",
        "paragraph": "Paragraph",
        "forecolor": "Font color",
        "backcolor": "Highlight color",
        "insertdate": "Insert current date",
        "inserttime": "Insert current time",
        "rtl": "Change text direction to right-to-left",
        "ltr": "Change text direction to left-to-right",
        "emotions": "Insert emotion",
        "fonts": "Font",
        "fontsize": "Font size",
        "fontstyle": "Font style",
        "blockformat": "Paragraph style",
        "help": "Help",
        "hr": "Insert horizontal rule",
        "image": "Insert image",
        "imagespecial": "Choose an image to insert",
        "link": "Insert hyperlink",
        "unlink": "Remove hyperlink",
        "bullist": "Bullets",
        "numlist": "Numbering",
        "media": "Insert medium",
        "pastetext": "Paste plaintext",
        "paste_keyboardmsg": "Use %s on your keyboard to paste the text into the window.",
        "print": "Print document",
        "preview": "Preview document",
        "scayt": "Turn spellcheck on/ off",
        "search": "Search",
        "replace": "Search and Replace",
        "sub": "Subscript",
        "sup": "Superscript",
        "table": "Insert table",
        "table_noun": "Table",
        "visualaid": "Toggle visual aid on/ off"
    },
     "nl_NL": {
        "cancel": "Annuleren",
        "insert": "Invoegen",
        "bold": "Vet",
        "italic": "Schuingedrukt",
        "underline": "Onderstreept",
        "strikethrough": "Doorgestreept",
        "justifyleft": "Recht uitlijnen",
        "justifycenter": "Centreren",
        "justifyright": "Rechts uitlijnen",
        "justifyfull": "Justify",
        "removeformat": "Stijlen verwijderen",
        "cut": "Knippen",
        "copy": "Kopieren",
        "paste": "Plakken",
        "outdent": "Inspringen verkleinen",
        "indent": "Inspringen vergroten",
        "undo": "Ongedaan maken",
        "redo": "Opnieuw",
        // plugin keys:
        "anchor": "Anchor invoegen",
        "blockquote": "Blockquote",
        "charmap": "Speciale tekens",
        "code": "HTML broncode",
        "listitem": "Lijst item",
        "nbsp": "Niet-brekende spatie",
        "break": "Regelafbreuk",
        "paragraph": "Paragraaf",
        "forecolor": "Tekstkleur",
        "backcolor": "Markeerkleur",
        "insertdate": "Huidige datum invoegen",
        "inserttime": "Huidige tijd invoegen",
        "rtl": "Verander tekstrichting naar rechts-naar-links",
        "ltr": "Verander tekstrichting naar links-naar-rechts",
        "emotions": "Emoticon invoegen",
        "fonts": "Lettertype",
        "fontsize": "Letter grootte",
        "fontstyle": "Tekststijl",
        "blockformat": "Paragraafstijl",
        "help": "Hulp",
        "hr": "Horizontale lijn invoegen",
        "image": "Afbeelding invoegen",
        "imagespecial": "Afbeelding kiezen",
        "link": "Link invoegen",
        "unlink": "Link verwijderen",
        "bullist": "Ongenummerd",
        "numlist": "Genummerd",
        "media": "Medium invoegen",
        "pastetext": "Tekst Plakken",
        "paste_keyboardmsg": "Gebruik %s op uw toetsenbord om tekst in dit scherm te plakken.",
        "print": "Printen",
        "preview": "Voorbeeldvertoning",
        "scayt": "Spellingscontrole aan/ uit",
        "search": "Zoeken",
        "replace": "Zoeken en vervangen",
        "sub": "Subscript",
        "sup": "Superscript",
        "table": "Tabel invoegen",
        "table_noun": "Tabel",
        "visualaid": "Visuele hulp aan/ uit"
    }
};

apf.TOOLBARITEM   = 0x0001;//"toolbaritem";
apf.TOOLBARBUTTON = 0x0002;//"toolbarbutton";
apf.TOOLBARPANEL  = 0x0004;//"toolbarpanel";
apf.TEXTMACRO     = 0x0008;//"textmacro";
apf.CMDMACRO      = 0x0010;//"commandmacro";

/**
 * @class plugin
 * @constructor
 * @extends ContentEditable
 * @namespace apf
 * @author Mike de Boer  (mike AT javeline DOT com)
 *
 * Example plugin:
 * <code language=javascript>
 * apf.ContentEditable.plugin("sample", function() {
 *     this.name    = "SamplePluginName";
 *     this.type    = "PluginType";
 *     this.subType = "PluginSubType";
 *     this.hook    = "EventHook";
 *     this.params  = null;
 *
 *     this.execute = function(editor) {
 *         // code to be executed when the event hook is fired
 *     }
 *     // That's it! you can add more code below to your liking...
 * });
 * </code>
 */
apf.ContentEditable.plugin = function(sName, fExec) {
    apf.ContentEditable.plugin[sName] = function() {
        this.uniqueId = apf.all.push(this) - 1;

        /**
         * Appends a new AML element - in its string representation - to an
         * existing AML node. A new AML node will be created as specified by the
         * contents of sNode and appended to oParent.
         *
         * @param {String}  sNode
         * @param {AmlNode} oParent
         * @type  {AmlNode}
         */
        this.appendAmlNode = function(sNode, oParent) {
            if (!sNode) return null;

            var aml = apf.getXml("<tempnode>" + sNode + "</tempnode>");
            return apf.AmlParser.parseMoreAml(aml, oParent, this.editor, true);
        };

        this.dispatchEvent = function() {
            var _self = this;
            window.setTimeout(function() {
                if (_self.type == apf.editor.CONTEXTPANEL
                  && _self.queryState(_self.editor) == apf.editor.ON)
                    return;
                _self.state = apf.editor.OFF;
                if (_self.editor)
                    _self.editor.$notifyButton(_self.name, _self.state);
                //@todo: add animation?
                apf.popup.hide();
                apf.popup.last = null;
            });

            return false;
        };

        this.$destroy = function() {
            apf.popup.forceHide(); // @todo should we keep this, or does apf.Popup destroy itself? what if we removeNode() the editor?
            this.buttonNode = this.editor = null;
            delete this.buttonNode;
            delete this.editor;
            if (this.destroy)
               this.destroy();
        }

        fExec.apply(this, arguments);
    };
};

// #endif
