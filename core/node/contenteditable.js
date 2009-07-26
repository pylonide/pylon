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

    var lastActiveNode, wasFocussable, lastValue, mouseOver, mouseOut, mouseDown,
        objectHandles = false,
        tableHandles  = false,
        lastPos       = 0,
        activeNode    = null,
        tabStack      = null,
        _self         = this;

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
            setTimeout(function(){
                _self.$selection.selectNode(node);
            });
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
        if (activeNode) {
            var lastPos = (tabStack || initTabStack()).indexOf(oNode);
            removeEditor(activeNode, true);
            oNode = initTabStack()[lastPos];
            setTimeout(function(){oNode.focus();});
        }

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

        _self.$selection = new apf.selection(window, document);
        _self.$selection.cache();
    }

    function removeEditor(oNode, bProcess, callback) {
        if (!oNode) oNode = activeNode;
        if (!oNode || oNode.nodeType != 1) return oNode;
        _self.$selection.collapse(true);

        activeNode = null;

        apf.setStyleClass(oNode, null, ["contentEditable_over", "contentEditable_active"]);

        if (apf.isIE)
            oNode.contentEditable = false;
        else
            document.designMode = "off";

        if (!bProcess || oNode.innerHTML == lastValue) {
            oNode.innerHTML = lastValue;
            return oNode;
        }
        
        var lastPos = (tabStack || initTabStack()).indexOf(oNode);
        
        // do additional handling, first we check for a change in the data...
        var xpath = oNode.getAttribute("xpath");
        if (apf.queryValue(_self.xmlRoot.ownerDocument, xpath) != oNode.innerHTML) {
            _self.edit(xpath, oNode.innerHTML);
        }

        if (callback)
            setTimeout(callback);

        return initTabStack()[lastPos];
    }

    function execCommand(name, param) {
        _self.$selection.cache();
        (apf.isIE ? activeNode : document).execCommand(name, false, param);
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
        e = e || window.event;
        var code = e.which || e.keyCode;
        
        if (!activeNode) {
            //F2 starts editing
            if (code == 113) {
                //@todo find the item of the this.$selected
                createEditor((tabStack || initTabStack())[0]);
                if (activeNode) {
                    activeNode.focus();
                    _self.$selection.selectNode(activeNode.firstChild);
                }
            }
            
            return;
        }

        _self.$selection.cache();
        var el = _self.$selection.getSelectedNode(), found;

        if (!apf.isIE && !apf.isChildOf(activeNode, el, true)) {
            // #ifdef __DEBUG
            apf.console.log('ContentEditable - keyDown: no child of mine');
            // #endif
            var callback = null;
            if (apf.isChildOf(this.oExt, el)) {
                // #ifdef __DEBUG
                apf.console.log('ContentEditable - keyDown: el IS a child of mine');
                // #endif
                while (el.parentNode && !(el.className && el != this.oExt
                  && el.className.indexOf("contentEditable") != -1))
                    el = el.parentNode;

                if (el.className && el.className.indexOf("contentEditable") != -1) {
                    callback = function() {
                        createEditor(el);
                        _self.$selection.selectNode(el.lastChild);
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
            if (code == 8 && _self.$selection.getType() == "Control") {
                _self.$selection.remove();
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
            var bShift = e.shiftKey;
            // a callback is passed, because the call is a-sync
            oNode = removeEditor(activeNode, true);
            if (oNode) {
                oNode = tabStack[
                    (lastPos = tabStack.indexOf(oNode) + (bShift ? -1 : 1))
                ];
                
                createEditor(oNode);
                oNode.focus();
                _self.$selection.selectNode(oNode.firstChild);

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
    this.$buttons        = ['Bold', 'Italic', 'Underline'];
    this.$plugins        = {};
    this.$pluginsHooks   = {};
    this.$pluginsTypes   = {};
    this.$pluginsKeys    = [];
    this.$pluginsActive  = null;
    this.$pluginsOn      = ['pasteword', 'tablewizard'];
    this.$nativeCommands = ['bold', 'italic', 'underline', 'strikethrough',
                            'justifyleft', 'justifycenter', 'justifyright',
                            'justifyfull', 'removeformat', 'cut', 'copy',
                            'paste', 'outdent', 'indent', 'undo', 'redo'];

    this.$supportedProperties.push("contenteditable", "state", "plugins",
        "realtime");
    this.$booleanProperties["contenteditable"] = true;
    this.$booleanProperties["realtime"]        = true;
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

    this.$propHandlers["state"] = function(value){
        this.state = parseInt(value); // make sure it's an int
        // the state has changed, update the button look/ feel
        setTimeout(function() {
            _self.notifyAll(value);
            if (_self.$pluginsActive == "code")
                _self.notify("code", apf.SELECTED);
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
                meta   : (plugin.keyBinding.indexOf('meta')  > -1),
                control: (plugin.keyBinding.indexOf('ctrl')  > -1),
                alt    : (plugin.keyBinding.indexOf('alt')   > -1),
                shift  : (plugin.keyBinding.indexOf('shift') > -1),
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

    /***************************************************************************
     * PUBLIC
     **************************************************************************/

    this.edit = function(xpath, value) {
        this.executeActionByRuleSet("edit", "edit", this.xmlRoot.ownerDocument
            .selectSingleNode(xpath), value);
    }
};

apf.ON             = 1;
apf.OFF            = 0;
apf.DISABLED       = -1;
apf.VISIBLE        = 2;
apf.HIDDEN         = 3;
apf.SELECTED       = 4;

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
 * apf.ContentEditable.plugin('sample', function() {
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
                    _self.editor.notify(_self.name, _self.state);
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
