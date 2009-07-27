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
    
    var lastActiveNode, wasFocussable, lastValue, mouseOver, mouseOut, 
        mouseDown, docklet,
        objectHandles = false,
        tableHandles  = false,
        bStandalone   = false,
        lastPos       = 0,
        activeNode    = null,
        tabStack      = null,
        oButtons      = {},
        oToolbar      = null,
        _self         = this;

    this.addEventListener("focus", function(e){
        if (!this.contenteditable || skipFocusOnce && !(skipFocusOnce = false))
            return;

        if (lastActiveNode && lastActiveNode.parentNode 
          || typeof e.shiftKey == "boolean") {
            createEditor(lastActiveNode || (tabStack 
                || initTabStack())[e.shiftKey ? tabStack.length - 1 : 0]);

            if (lastActiveNode)
                lastActiveNode.focus();
        }
        lastActiveNode = null;
        
        if (activeNode) {
            var node = activeNode;
            setTimeout(function(){
                _self.$selection.selectNode(node);
                node.focus();
            }, 10);
        }
    });
    
    this.addEventListener("blur", function(e){
        if (!this.contenteditable)
            return;
        
        lastActiveNode = activeNode;
        if (e.toElement == docklet) 
            return;

        removeEditor(activeNode, true);
    });

    var skipFocusOnce;
    function createEditor(oNode) {
        if (!oNode || oNode.nodeType != 1 || activeNode == oNode) 
            return;
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
                _self.getModel().validate(xmlNode, false, _self.validityState, _self);
            }, 10);
        }
        
        var xmlNode = _self.xmlRoot.ownerDocument.selectSingleNode(oNode.getAttribute("xpath"));

        if (!_self.hasFocus())
            skipFocusOnce = true;

        activeNode = oNode;
        apf.setStyleClass(oNode, "contentEditable_active", ["contentEditable_over"]);

        if (apf.isIE) {
            oNode.contentEditable = true;
        }
        else {
            document.body.setAttribute("spellcheck", "false");
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

        var v, rule;
        if (v = _self.getModel().$validation)
            rule = v.getRule(xmlNode);
        
        // #ifdef __PARSER_HTML
        if (rule && apf.isTrue(rule.richtext)) {
            lastValue = [];
            oNode.innerHTML = lastValue[0] = apf.htmlCleaner.prepare((lastValue[1] = oNode.innerHTML)
                .replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, 
                "<br _apf_marker='1' /><br _apf_marker='1' />"));
        }
        else 
        //#endif
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

        var showDocklet = rule && apf.isTrue(rule.richtext);
        if (showDocklet && !docklet)
            _self.$editable();
        if (docklet)
            docklet.setProperty("visible", showDocklet);

        _self.$selection = new apf.selection(window, document);
        _self.$selection.cache();
    }

    function removeEditor(oNode, bProcess, callback) {
        if (!oNode) oNode = activeNode;
        if (!oNode || oNode.nodeType != 1) return false;
        _self.$selection.collapse(true);

        activeNode = null;

        apf.setStyleClass(oNode, null, ["contentEditable_over", "contentEditable_active"]);

        if (apf.isIE)
            oNode.contentEditable = false;
        else
            document.designMode = "off";

        if (docklet)
            docklet.setProperty("visible", false);

        if (!bProcess || oNode.innerHTML.toLowerCase().replace(/[\r\n]/g, "") == (lastValue.length ? lastValue[0] : lastValue).toLowerCase().replace(/[\r\n]/g, "")) {
            oNode.innerHTML = lastValue[1] || lastValue;
            return false;
        }
        
        if (_self.validityState)
            _self.validityState.$reset();
        
        // do additional handling, first we check for a change in the data...
        var xpath = oNode.getAttribute("xpath");
        if (apf.queryValue(_self.xmlRoot.ownerDocument, xpath) != oNode.innerHTML) { //@todo this will not always work in IE
            var model = _self.getModel();
            
            var lastPos = (tabStack || initTabStack()).indexOf(oNode);
            var xmlNode = _self.xmlRoot.ownerDocument.selectSingleNode(xpath);
            
            var v, rule;
            if (v = model.$validation)
                rule = v.getRule(xmlNode);
    
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

    this.addEventListener("load", function(){
        if (!this.contenteditable)
            return;

        createEditor(initTabStack()[0]);
    });
    this.addEventListener("xmlupdate", function(){
        tabStack = null; // redraw of editable region, invalidate cache
    });
    //@todo skin change
    
    this.addEventListener("keydown", function(e) {
        if (!this.contenteditable)
            return;
        
        e = e || window.event;
        var isDone, code = e.which || e.keyCode;
        if (!activeNode) {
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
                }
            }
            
            return;
        }

        _self.$selection.cache();
        var el = _self.$selection.getSelectedNode(), found;

        if (!apf.isIE && !apf.isChildOf(activeNode, el, true)) {
            // #ifdef __DEBUG
            apf.console.log("ContentEditable - keyDown: no child of mine");
            // #endif
            var callback = null;
            if (apf.isChildOf(this.oExt, el)) {
                // #ifdef __DEBUG
                apf.console.log("ContentEditable - keyDown: el IS a child of mine");
                // #endif
                while (el.parentNode && !(el.className && el != this.oExt
                  && el.className.indexOf("contentEditable") != -1))
                    el = el.parentNode;

                if (el.className && el.className.indexOf("contentEditable") != -1) {
                    callback = function() {
                        createEditor(el);
                        _self.$selection.selectNode(el);
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

        if (apf.isIE && code == 8 && _self.$selection.getType() == "Control") {
            _self.$selection.remove();
            found = true;
        }
        else if (code == 13) { //Enter
            isDone = e.ctrlKey || apf.isMac && e.metaKey;
            if (!isDone) {
                var model = this.getModel();
                var xmlNode = _self.xmlRoot.ownerDocument.selectSingleNode(activeNode.getAttribute("xpath"));
                var rule = model && model.$validation && model.$validation.getRule(xmlNode) || {multiline:true};
                isDone = !apf.isTrue(rule.multiline);
            }
        }
        else if ((e.ctrlKey || (apf.isMac && e.metaKey)) && !e.shiftKey && !e.altKey) {
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
            }
        }
        
        // Tab navigation handling
        if (code == 9 || isDone) {
            var bShift = e.shiftKey;
            // a callback is passed, because the call is a-sync
            var lastPos = (tabStack || initTabStack()).indexOf(activeNode);
            var oNode = removeEditor(activeNode, true) || initTabStack()[lastPos];
            
            oNode = tabStack[
                tabStack.indexOf(oNode) + (bShift ? -1 : 1)
            ];
            
            if (oNode) {
                createEditor(oNode);
                oNode.focus();
                _self.$selection.selectNode(oNode);

                found = true;
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
        else if (activeNode)
            e.returnValue = -1;
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

    /***************************************************************************
     * PROTECTED
     **************************************************************************/

    this.$regbase        = this.$regbase | __CONTENTEDITABLE__;
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
                while ((!el.className || el.className.indexOf("contentEditable") == -1) && el != _self.oExt) {
                    el = el.parentNode;
                }
                if (!el || el == _self.oExt || el == activeNode) 
                    return;
                apf.setStyleClass(el, "contentEditable_over");
            });
            apf.addListener(_self.oExt, "mouseout",  mouseOut = function(e) {
                var el = e.srcElement || e.target;
                while ((!el.className || el.className.indexOf("contentEditable") == -1) && el != _self.oExt) {
                    el = el.parentNode;
                }
                if (!el || el == _self.oExt || el == activeNode) 
                    return;
                apf.setStyleClass(el, null, ["contentEditable_over"]);
            });
            apf.addListener(_self.oExt, "mousedown", mouseDown = function(e) {
                var el = e.srcElement || e.target;
                while ((!el.className || el.className.indexOf("contentEditable") == -1) && el != _self.oExt) {
                    el = el.parentNode;
                }
                
                if (!el || el == _self.oExt) {
                    if (activeNode)
                        removeEditor(activeNode, true);
                    return;
                }

                createEditor(el);
                e.cancelBubble = true;
                apf.window.$mousedown({srcElement: activeNode});
                setTimeout(function(){
                    //@todo Mike. The cursor position is lost!!! Please help me!
                    activeNode.focus();
                }, 10);
                
                return false;
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
     * @param {String} cmdName
     * @type Number
     */
    this.$queryCommand = function(cmdName) {
        if (apf.isGecko && (cmdName == "paste" || cmdName == "copy" || cmdName == "cut"))
            return apf.DISABLED;
        try {
            if (!this.oDoc.queryCommandEnabled(cmdName))
                return apf.DISABLED;
            else
                return this.oDoc.queryCommandState(cmdName)
                    ? apf.ON
                    : apf.OFF;
        }
        catch (e) {
            return apf.OFF;
        }
    };

    this.$execCommand = function(name, param) {
        _self.$selection.cache();
        (apf.isIE ? activeNode : document).execCommand(name, false, param);
    }

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
                state = this.$queryCommand(item);
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

        return _self.$queryCommand(id);
    }

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

    this.$editable = function() {
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
        // #ifdef __WITH_PARSER_HTML
        html = bNoParse ? html : apf.htmlCleaner.prepare(html);
        // #endif
        this.$selection.setContent(html);
        // notify SmartBindings that we changed stuff...
        this.change(this.getValue());

        if (bNoFocus) return;
        setTimeout(function() {
            _self.$selection.set();
            _self.$visualFocus();
        });
    };

    /***************************************************************************
     * PUBLIC
     **************************************************************************/

    this.language = "en_GB";//"nl_NL";

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
