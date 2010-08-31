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

// #ifdef __ENABLE_LIVEEDIT_RICHTEXT || __INC_ALL

apf.LiveEdit.richtext = function(){
    this.$state          = apf.ON;
    this.$buttons        = {};
    this.$classToolbar   = "editor_Toolbar";
    this.$plugins        = {};
    this.$pluginsHooks   = {};
    this.$pluginsTypes   = {};
    this.$pluginsKeys    = [];
    this.$pluginsActive  = null;
    this.$pluginsOn      = ["pasteword", "tablewizard"];//, "spell"];
    this.$nativeCommands = ["bold", "italic", "underline", "strikethrough",
                            "justifyleft", "justifycenter", "justifyright",
                            "justifyfull", "removeformat", "cut", "copy",
                            "paste", "outdent", "indent", "undo", "redo"];
    this.$changeTimer    = null;
    this.$toolbar        = null;

    // List of punctuation characters from
    // http://www.adobe.com/livedocs/coldfusion/5.0/Using_ColdFusion_Studio/language5.htm
    // ! ' # S % & ' ( ) * + , - . / : ; < = > ? @ [ / ] ^ _ { | } ~
    var rePunctuation    = /[\n\t!`#%&'"\(\)\*\.+-\.\/\:;<=>\?@\[\\\]\^_\{\|\}\~]+/g;
    
    this.$supportedProperties.push("state", "plugins", "language");
    
    this.$propHandlers["state"] = function(value){
        this.state = parseInt(value); // make sure it's an int
        // the state has changed, update the button look/ feel
        var _self = this;
        $setTimeout(function() {
            _self.$notifyAllButtons(value);
            if (_self.$pluginsActive == "code")
                _self.$notifyButton("code", apf.SELECTED);
        });
    };

    this.$propHandlers["plugins"] = function(value){
        this.$pluginsOn = value && value.splitSafe(",") || null;
        if (this.$pluginsOn && this.$pluginsOn.length) {
            for (var i = 0, l = this.$pluginsOn.length; i < l; i++)
                this.$addPlugin(this.$pluginsOn[i]);
        }
    };

    this.$propHandlers["language"] = function(value){
        // @todo implement realtime language switching
    };
    
    this.addEventListener("prop.liveedit", function(e){
        if (e.value) {
            if (this.plugins == undefined && this.$propHandlers["plugins"])
                this.$propHandlers["plugins"].call(this, this.$pluginsOn.join(","));
        }
        else {
            if (this.$docklet)
                this.$docklet.hide();
        }
    });
    
    /**
     * Event handler; fired when the user releases a key inside the editable area
     *
     * @see object.abstractevent
     * @param {Event} e
     * @type  {void}
     * @private
     */
    function keyupHandler(e) {
        var _self = this;
        //if (!this.$bStandalone)
        //    return;
        if (this.$selection)
            this.$selection.cache();
        if (this.$keyupTimer)
            return;

        function keyupHandler() {
            clearTimeout(_self.$keyupTimer);
            _self.$keyupTimer = null;
            if (_self.state == apf.DISABLED) return;
            _self.$notifyAllButtons();
            _self.dispatchEvent("typing", {editor: _self, event: e});
            _self.$notifyAllPlugins("typing", e.keyCode);
        }

        this.$keyupTimer = window.setTimeout(keyupHandler, 100);
    }
    
    function keydownHandler(e) {
        //if (!this.$bStandalone)
            //return;

        //@todo check the current field to see if it supports richtext
        var found,
            code = e.which || e.keyCode;

        if (apf.isIE) {
            switch (code) {
                case 66:  // B
                case 98:  // b
                case 105: // i
                case 73:  // I
                case 117: // u
                case 85:  // U
                //case 86:  // V |_ See this.$paste()
                //case 118: // v |  event handler...
                    if ((e.ctrlKey || (apf.isMac && e.metaKey)) && !e.shiftKey
                      && !e.altKey && this.realtime)
                        // #ifdef __WITH_DATAACTION
                        this.change(this.getValue());
                        /* #else
                        this.setProperty("value", this.getValue())
                        #endif*/
                    break;
                case 8: // backspace
                    found = false;
                    if (this.$selection.getType() == "Control") {
                        this.$selection.remove();
                        found = true;
                    }
                    listBehavior.call(this, e, true); //correct lists, if any
                    if (found)
                        return false;
                    break;
                case 46:
                    listBehavior.call(this, e, true); //correct lists, if any
                    break;
                case 9: // tab
                    if (listBehavior.call(this, e))
                        return false;
                    break;
            }
        }
        else {
            this.$visualFocus();
            if ((e.ctrlKey || (apf.isMac && e.metaKey)) && !e.shiftKey && !e.altKey) {
                found = false;
                switch (code) {
                    case 66: // B
                    case 98: // b
                        this.$execCommand("Bold");
                        found = true;
                        break;
                    case 105: // i
                    case 73:  // I
                        this.$execCommand("Italic");
                        found = true;
                        break;
                    case 117: // u
                    case 85:  // U
                        this.$execCommand("Underline");
                        found = true;
                        break;
                    case 86:  // V
                    case 118: // v
                        if (!apf.isGecko)
                            this.$paste();
                        //found = true;
                        break;
                }
                if (found) {
                    apf.stopEvent(e.htmlEvent || e);
                    if (this.realtime && this.$bStandalone)
                        // #ifdef __WITH_DATAACTION
                        this.change(this.getValue());
                        /* #else
                        this.setProperty("value", this.getValue())
                        #endif*/
                }
            }
            var sel, r, r2, m;
            // gecko cannot collapse the selection with the arrow keys. Please, don't ask me why...
            if (apf.isGecko && (code == 37 || code == 39) && !e.shiftKey && !e.metaKey && !e.ctrlKey && !this.$selection.isCollapsed()) {
                // get current range
                sel = this.$selection.get()
                r   = this.$selection.getRange();
                r2  = r.cloneRange();
                var _self = this;
                // we need to use a timeout here because a direct collapse() leaves
                // rendering artifacts.
                setTimeout(function() {
                    sel.removeAllRanges();
                    sel.addRange(r2);
                    _self.$selection.collapse((code == 37));
                }, 20);
            }
            // in webkit, first word cannot be reached by ctrl+left
            else if (apf.isWebkit && code == 37 && (e.ctrlKey || (apf.isMac && e.altKey)) && !e.shiftKey) {
                // get current range
                sel = this.$selection.get()
                r   = this.$selection.getRange();
                // get first word from node:
                r2  = r.cloneRange();
                r2.setStart(r2.commonAncestorContainer, 0);
                m   = r2.toString().match(/[\w]*(:?\W)?/g);
                if (m && m.length == 2 && !m[1]) { //only one word left
                    r2.setEnd(r2.commonAncestorContainer, 0);
                    sel.removeAllRanges();
                    sel.addRange(r2);
                }
            }
            // in gecko, the last word cannot be reached by ctrl+right (strangely 
            // enough this does not occur on mac - prolly 'cause it uses the alt-key)
            else if (apf.isGecko && code == 39 && !apf.isMac && e.ctrlKey && !e.altKey) {
                // get current range
                sel = this.$selection.get()
                r   = this.$selection.getRange();
                // get first word from node:
                r2  = r.cloneRange();
                if (r2.commonAncestorContainer.nodeType == 3) {
                    // set the end of the range to match the end of the string of the
                    // active textNode inside the active node.
                    var s = r2.commonAncestorContainer.textContent.replace(rePunctuation, ""),
                        l = s.length;
                    r2.setEnd(r2.commonAncestorContainer, l);
                    m = r2.toString().match(/[\w]*(:?\W)?/g);
                    if (m && m.length == 2 && !m[1]) { //only one word left
                        r2.setEnd(r2.commonAncestorContainer, l);
                        r2.setStart(r2.commonAncestorContainer, l);
                        sel.removeAllRanges();
                        sel.addRange(r2);
                    }
                }
            }
        }
        
        this.$visualFocus();
        if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
            found = this.$notifyKeyBindings({
                code   : code,
                control: e.ctrlKey,
                alt    : e.altKey,
                shift  : e.shiftKey,
                meta   : e.metaKey
            });
        }
        
        // Tab navigation handling
        if (code == 9) {
            if (listBehavior.call(this, e.htmlEvent || e))
                return apf.stopEvent(e.htmlEvent || e);
        }
        else if (code == 8 || code == 46) { //backspace or del
            listBehavior.call(this, e.htmlEvent || e, true); //correct lists, if any
        }
        
        if (found)
            return apf.stopEvent(e);
    };
    
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
            var plugin = this.$plugins[id];
            if (this.state == apf.DISABLED && !plugin.noDisable)
                return apf.DISABLED;
            return plugin.queryState
                ? plugin.queryState(this)
                : this.state;
        }

        if (this.state == apf.DISABLED)
            return apf.DISABLED;

        return this.$queryCommandState(id);
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
        if (typeof this.$activeDocument.queryCommand != "function")
            return null;
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
                    if (this.$plugins["bullist"].queryState(this) != apf.OFF
                     && this.$plugins["numlist"].queryState(this) != apf.OFF)
                        bNoSel = false;
                }
                var oNode = this.$selection.getSelectedNode();
                if (bNoSel && oNode && oNode.tagName == "BLOCKQUOTE")
                    bNoSel = false;
            }

            if (bNoSel) {
                var el = this.$bStandalone
                    ? this.$activeDocument.body
                    : this.$activeNode;
                //#ifdef __WITH_HTML_CLEANER
                el.innerHTML = apf.htmlCleaner.prepare(el.innerHTML);
                //#endif
                this.$controlAgentBehavior(el);
            }
            var r = this.$selection.getRange();
            if (r)
                r.scrollIntoView();
        }

        this.$notifyAllButtons();
        
        if (this.$bStandalone) {
            // #ifdef __WITH_DATAACTION
            this.change(this.getValue());
            /* #else
            this.setProperty("value", this.getValue())
            #endif*/
        }

        var _self = this;
        $setTimeout(function() {
            //_self.$notifyAllButtons(); // @todo This causes pain, find out why
            if (!bNoSel)
               _self.$selection.set();
            if (apf.isIE) {
                _self.focus();
                $setTimeout(function() {_self.$visualFocus();});
            }
            else
                _self.$visualFocus();

            _self.dispatchEvent("execcommand", {name: name, param: param});
        });
    };

    /**
     * Add a plugin to the collection IF an implementation actually exists.
     *
     * @param {String} sPlugin The plugin identifier/ name
     * @type  {apf.LiveEdit.plugin}
     */
    this.$addPlugin = function(sPlugin) {
        if (this.$plugins[sPlugin])
            return this.$plugins[sPlugin];
        if (!apf.LiveEdit.plugin[sPlugin]) return null;
        // yay, plugin does exist, so we can instantiate it for the editor
        var plugin = new apf.LiveEdit.plugin[sPlugin](sPlugin);
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

        var oButton = this.$buttons[item];
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
        var item, o = this.$buttons;
        for (item in o)
            this.$notifyButton(item, state);
    };
    
    this.$restoreFocus = function(bWithSel) {
        // for now, only IE needs this workaround to return the focus to the
        // liveEdit area - whilst preserving the correct state.
        if (apf.isIE) {
            var _self = this;
            $setTimeout(function() {
                if (bWithSel)
                    _self.$selection.set();
                _self.focus();
                $setTimeout(function() {_self.$visualFocus();});
            });
        }
    };

    /**
     * Handler function; invoked when a toolbar button node was clicked
     *
     * @see object.abstractevent
     * @param {Event}      e
     * @param {DOMElement} oButton
     * @type  {void}
     */
    this.$buttonClick = function(e, oButton, userAction) {
        if (userAction && this.disabled)
            return;
        
        if (this.$selection)
            this.$selection.cache();

        apf.setStyleClass(oButton, "active");
        var item = oButton.getAttribute("type");

        //context 'this' is the buttons' DIV domNode reference
        if (!e._bogus) {
            e.isPlugin = this.$plugins[item] ? true : false;
            e.state    = getState.call(this, item, e.isPlugin);
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
                    this.$plugins[(this.$pluginsActive = item)].execute(this);
                else
                    this.$execCommand(item);
                e.state = getState.call(this, item, e.isPlugin);
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
            sButton = this.$bStandalone ? "button" : "toolbarbutton",
            oNode   = this.$docklet.$getOption("toolbars"),
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

            this.$docklet.$getNewContext("toolbar");
            tb = bAfterRender
                ? apf.insertHtmlNode(this.$docklet.$getLayoutNode("toolbar"), oParent, oParent.firstChild)
                : oParent.insertBefore(this.$docklet.$getLayoutNode("toolbar"), oParent.firstChild);//, oParent.lastChild

            for (z = 0, x = buttons.length; z < x; z++) {
                item = buttons[z];

                if (item == "|") { //seperator!
                    this.$docklet.$getNewContext("divider");
                    if (bAfterRender)
                        apf.insertHtmlNode(this.$docklet.$getLayoutNode("divider"), tb);
                    else
                        tb.appendChild(this.$docklet.$getLayoutNode("divider"));
                }
                else {
                    this.$docklet.$getNewContext(sButton);
                    oButton = bAfterRender
                        ? oButton = apf.insertHtmlNode(this.$docklet.$getLayoutNode(sButton), tb)
                        : oButton = tb.appendChild(this.$docklet.$getLayoutNode(sButton));

                    bIsPlugin = false;
                    // Plugin toolbarbuttons may only be placed inside the main toolbar
                    if (sSkinTag == "toolbar" && !this.$nativeCommands.contains(item)) {
                        plugin = this.$addPlugin(item);
                        // #ifdef __DEBUG
                        if (!plugin)
                            apf.console.error("Plugin '" + item + "' can not "
                                            + "be found and/ or instantiated.",
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

                        this.$docklet.$getLayoutNode(sButton, "label", oButton)
                            .setAttribute("class", "editor_icon editor_" + plugin.icon);

                        oButton.setAttribute("title", this.$translate(plugin.name));
                    }
                    else {
                        this.$docklet.$getLayoutNode(sButton, "label", oButton)
                            .setAttribute("class", "editor_icon editor_" + item);

                        oButton.setAttribute("title", this.$translate(item));
                    }

                    oButton.setAttribute("onmousedown", sBtnClick || "apf.all["
                        + this.$uniqueId + "].$buttonClick(event, this, true);");
                    oButton.setAttribute("onmouseover", 
                        "apf.setStyleClass(this, 'hover', null, true);");
                    oButton.setAttribute("onmouseout", 
                        "apf.setStyleClass(this, '', ['hover'], true);");

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
    
    var wasVisible;
    this.$editors["richtext"] = {
        create : function(oHtml, rule){
            this.getValue = function(){
                return apf.htmlCleaner.parse(oHtml.innerHTML);
            };
            oHtml.setAttribute("richtext", "true");

            if (apf.isGecko) {
                try {
                    // On each return, insert a BR element
                    document.execCommand("insertBrOnReturn", false, true);
                    // Tell Gecko (Firefox 1.5+) to enable or not live resizing of objects
                    document.execCommand("enableObjectResizing", false, false);
                    // Disable the standard table editing features of Firefox.
                    document.execCommand("enableInlineTableEditing", false, false);
                }
                catch(ex){}
            }
            
            if (!this.$docklet)
                this.$editable();
            if (this.$docklet) {
                this.$docklet.show();
                
                //Docklet animation
                var pos = apf.getAbsolutePosition(oHtml);
                var w   = this.$docklet.$ext.offsetWidth;
                var h   = this.$docklet.$ext.offsetHeight;
                if (pos[0] + oHtml.offsetWidth + w + 5 > apf.getWindowWidth())
                    pos[0] = apf.getWindowWidth() - w - 5;
                else 
                    pos[0] += oHtml.offsetWidth + 5;

                if (pos[1] - h - 5 < 0) {
                    if (pos[1] + oHtml.offsetHeight + 5 + h < apf.getWindowHeight())
                        pos[1] = pos[1] + oHtml.offsetHeight + 5;
                    else
                        pos[1] = 0;
                }
                else 
                    pos[1] -= h + 5;
                
                var dPos = apf.getAbsolutePosition(this.$docklet.$ext);
                if (this.$control)
                    this.$control.stop();
                this.$control = {};

                var tweens = [{
                    from    : dPos[0],
                    to      : pos[0],
                    type    : "left"
                },{
                    from    : dPos[1],
                    to      : pos[1],
                    type    : "top"
                }];
                if (!wasVisible)
                    tweens.push({
                        from    : 0, //apf.getOpacity(this.$docklet.$ext),
                        to      : 1,
                        type    : "fade"
                    });
                else
                    apf.setOpacity(this.$docklet.$ext, 1);

                apf.tween.multi(this.$docklet, {
                    steps   : 30,
                    interval: 10,
                    control : this.$control,
                    anim    : apf.tween.easeInOutCubic,
                    tweens  : tweens
                });
                
                setTimeout(function(){wasVisible = true;});
            }
            
            this.setProperty("state", apf.OFF);
            
            if (apf.hasContentEditable)
                oHtml.contentEditable = true;
            else {
                document.body.setAttribute("spellcheck", "false");
                document.designMode = "on";
            }
            
            // #ifdef __WITH_HTML_CLEANER
            this.$lastValue = [];
            this.$lastValue[0] = apf.htmlCleaner.prepare(
                (this.$lastValue[1] = oHtml.innerHTML)
                  .replace(/<p[^>]*>/gi, "").replace(/<\/P>/g, "").replace(/<\/p>/g, 
                    "<br _apf_marker='1' /><br _apf_marker='1' />"));

            if (this.$lastValue[1] != this.$lastValue[0]) {
                //Set bookmark for cursor position
                var obm = this.$selection.getBookmark();
                oHtml.innerHTML = this.$lastValue[0]; 
                this.$controlAgentBehavior(oHtml);
                // restore selection to bookmark
                this.$selection.moveToBookmark(obm);
            }
            //#endif

            this.addEventListener("keydown", keydownHandler, true);
            this.addEventListener("keyup",   keyupHandler, true);
        },
        remove : function(oHtml, rule){
            oHtml.blur();
            if (apf.hasContentEditable)
                oHtml.contentEditable = false;
            else
                document.designMode = "off";
            oHtml.setAttribute("richtext", "false");

            this.removeEventListener("keydown", keydownHandler, true);
            this.removeEventListener("keyup",   keyupHandler, true);
        }
    };
    
    this.addEventListener("$createEditor", function(e) {
        if (e.editor != "richtext" && this.$docklet) {
            setTimeout(function(){wasVisible = false;});
            this.$docklet.hide();
        }
    });
    
    this.addEventListener("$removeEditor", function(e) {
        if (e.editor == "richtext" && this.$docklet) {
            setTimeout(function(){wasVisible = false;});
            this.$docklet.hide();
        }
    });
    
    this.$editable = function(callback) {
        if (this.getAttribute("plugins")) {
            this.$propHandlers["plugins"]
                .call(this, this.getAttribute("plugins"));
        }
        if (this.getAttribute("language")) {
            this.$propHandlers["language"]
                .call(this, this.getAttribute("language"));
        }

        // no External representation yet, which means that we're dealing with
        // a full-mode editor.
        if (!this.$ext) {
            this.$docklet     = this;
            this.$bStandalone = true;
            this.$ext = this.$getExternal("main", null, function(oExt){
                var o = this.$getLayoutNode("main", "toolbar");
                this.$drawToolbars(o);
            });
            this.$toolbar = this.$getLayoutNode("main", "toolbar", this.$ext);

            this.addEventListener("keydown", keydownHandler, true);
            this.addEventListener("keyup",   keyupHandler, true);
        }
        //@todo apf3.0 get this from portal.js
        else if (!this.$docklet && !(apf.LiveEdit.toolwin = this.$docklet)) {
            var _self     = this;
            this.$docklet = apf.LiveEdit.toolwin =
                new apf.modalwindow({
                    htmlNode   : document.body,
                    skinset    : apf.getInheritedAttribute(this.parentNode, "skinset"),
                    buttons    : "",
                    title      : "Format",
                    icon       : "application.png",
                    resizable  : false, //"horizontal",
                    draggable  : true,
                    focussable : true,
                    modal      : false,
                    left       : 500,
                    top        : 100,
                    width      : 275,
                    zindex     : 100000,
                    //resizeoutline : true,
                    onfocus    : function(){
                        _self.focus();
                    }
                }, "toolwindow");

            var aNodes = this.$docklet.$ext.getElementsByTagName("div");
            for (var j = 0, l = aNodes.length; j < l; j++) {
                if (aNodes[j].className.indexOf("content") != -1) {
                    this.$toolbar = aNodes[j];
                    break;
                }
            }
            this.$drawToolbars(this.$toolbar, "toolbar", null, true);
            
            // @todo make this hack disappear...
            //this.$toolbar.innerHTML = this.$toolbar.innerHTML; //Why is this here?
        }

        if (callback)
            callback.call(this);

        if (this.$toolbar) {
            // fetch the DOM references of all toolbar buttons and let the
            // respective plugins finish initialization
            var item, plugin,
                btns = this.$toolbar.getElementsByTagName("div"),
                i    = btns.length - 1;
            for (; i >= 0; i--) {
                item = btns[i].getAttribute("type");
                if (!item) continue;

                this.$buttons[item] = btns[i];
                plugin = this.$plugins[item];
                if (!plugin) continue;

                plugin.buttonNode = btns[i];

                if (plugin.init)
                    plugin.init(this);
            }
        }
    };

    this.$getPluginOption = function(node) {
        return this.$docklet.$getOption(node);
    };

    /**
     * Make an instance of apf.popup (identified with a pointer to the cached
     * DOM node - sCacheId) visible to the user.
     *
     * @param {apf.LiveEdit.plugin} oPlugin  The plugin instance
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

        // using $setTimeout here, because I want the popup to be shown AFTER the
        // event bubbling is complete. Another click handler further up the DOM
        // tree may call a apf.popup.forceHide();
        $setTimeout(function() {
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
        if ((!bIsPlugin && !apf.LiveEdit.i18n[this.language][key])
          || (bIsPlugin && !apf.LiveEdit.i18n[this.language]["plugins"][key]))
            apf.console.error("Translation does not exist"
                + (bIsPlugin ? " for plugin" : "") + ": " + key);
        // #endif

        return bIsPlugin
            ? apf.LiveEdit.i18n[this.language]["plugins"][key]
            : apf.LiveEdit.i18n[this.language][key];
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
        // #ifdef __WITH_HTML_CLEANER
        html = bNoParse ? html : apf.htmlCleaner.prepare(html);
        // #endif
        this.$selection.setContent(html, true);
        if (this.$bStandalone) {
            // notify SmartBindings that we changed stuff...
            // #ifdef __WITH_DATAACTION
            this.change(this.getValue());
            /* #else
            this.setProperty("value", this.getValue())
            #endif*/
        }

        if (!bNoFocus)
            this.$restoreFocus();
    };

    /**
     * Paste (clipboard) data into the Editor
     *
     * @see element.editor.method.inserthtml
     * @param {Event} e
     * @type  {void}
     */
    this.$paste = function (e) {
        var _self = this;
        $setTimeout(function() {
            var s = _self.$activeDocument.body.innerHTML;
            if (s.match(/mso[a-zA-Z]+/i)) { //check for Paste from Word
                var o = _self.$plugins["pasteword"];
                if (o)
                    _self.$propHandlers["value"].call(_self, o.parse(s));
            }
            if (_self.realtime)
                _self.change(_self.getValue());
        });
    }

    /**
     * Corrects the default/ standard behavior of user agents that do not match
     * our intentions or those of the user.
     *
     * @param {DOMElement} oParent LiveEdit element
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
                        this.$selection.selectNode(oNode);
                        this.$selection.remove();
                        this.$selection.collapse(false);
                        break;
                    }
                }
                oParent = oNode;
            }
        }
        else if (apf.isWebkit) {
            this.$activeDocument.designMode = "on";
        }
        else if (apf.isIE) {
            // yes, we fix hyperlinks...%&$#*@*!
            var s, aLinks = oParent.getElementsByTagName("a");
            for (var i = 0, j = aLinks.length; i < j; i++) {
                s = aLinks[i].getAttribute("_apf_href");
                if (s) //prefix 'http://' if it's not there yet...
                    aLinks[i].href = (!s.match(/^[a-zA-Z]+\:/) ? "http://" : "") + s;
            }
        }
    };

    this.language = "en_GB";//"nl_NL";
    this.state    = apf.OFF;
};

apf.ON       = 1;
apf.OFF      = 0;
apf.DISABLED = -1;
apf.VISIBLE  = 2;
apf.HIDDEN   = 3;
apf.SELECTED = 4;

apf.LiveEdit.i18n = {
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
        "pasteworddialog": "Paste from Word",
        "pastetext": "Paste plaintext",
        "paste_keyboardmsg": "Use %s on your keyboard to paste the text into the window.",
        "print": "Print document",
        "preview": "Preview document",
        "spell": "Turn spellcheck on/ off",
        "search": "Search",
        "replace": "Search and Replace",
        "findnext": "Find next",
        "doreplace": "Replace",
        "replaceall": "Replace all",
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
        "pasteworddialog": "Word Tekst Plakken",
        "pastetext": "Tekst Plakken",
        "paste_keyboardmsg": "Gebruik %s op uw toetsenbord om tekst in dit scherm te plakken.",
        "print": "Printen",
        "preview": "Voorbeeldvertoning",
        "spell": "Spellingscontrole aan/ uit",
        "search": "Zoeken",
        "replace": "Zoeken en vervangen",
        "findnext": "Volgende",
        "doreplace": "Vervangen",
        "replaceall": "Vervang alle",
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
 * @extends LiveEdit
 * @namespace apf
 * @author Mike de Boer  (mike AT javeline DOT com)
 *
 * Example plugin:
 * <code language=javascript>
 * apf.LiveEdit.plugin("sample", function() {
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
apf.LiveEdit.plugin = function(sName, fExec) {
    apf.LiveEdit.plugin[sName] = function() {
        this.$uniqueId = apf.all.push(this) - 1;

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
            var domParser = new apf.DOMParser(),
                oFrag     = this.editor.ownerDocument.createDocumentFragment();
            oFrag.$int    = oParent;
            var oNode     = domParser.parseFromString(sNode, "text/xml", {
                doc     : this.editor.ownerDocument,
                docFrag : oFrag
            });
            return oNode.firstChild;
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
            // @todo should we keep this, or does apf.Popup destroy itself? what
            // if we removeNode() the editor?
            apf.popup.forceHide();
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
