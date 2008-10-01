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

// #ifdef __EDITOR || __INC_ALL
/**
 * Component displaying an Editor
 *
 * @classDescription This class creates a new rich text editor
 * @return {editor}  Returns a new editor instance
 * @type   {editor}
 * @constructor
 * @addnode components:editor
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 *
 * @inherits jpf.Validation
 * @inherits jpf.XForms
 */

jpf.editor = jpf.component(jpf.NODE_VISIBLE, function() {
    var inited, complete, oButtons = {};
    
    /**** Default Properties ****/
    
    var commandQueue = [];
    var _self        = this;
    
    //@todo Make the this.buttons array authorative for button based plugin loading
    this.editorState     = jpf.editor.ON;
    this.$buttons        = ['Bold', 'Italic', 'Underline'];
    this.$plugins        = [];
    this.$nativeCommands = ['bold', 'italic', 'underline', 'strikethrough',
                            'justifyleft', 'justifycenter', 'justifyright',
                            'justifyfull', 'removeformat', 'cut', 'copy',
                            'paste', 'outdent', 'indent', 'undo', 'redo'];
    this.$classToolbar   = 'editor_Toolbar';
    
    /**** Properties and Attributes ****/
    
    //this.forceVScrollIE       = true;
    //this.UseBROnCarriageReturn= true;
    this.imagehandles = false;
    this.tablehandles = false;
    this.output       = 'text'; //can be 'text' or 'dom', if you want to retrieve an object.
    
    this.$supportedProperties.push("value", "imagehandles", "tablehandles",
        "output");

    this.$propHandlers["value"] = function(html){
        if (!inited || !complete)
            return;
            
        if (typeof html == "undefined") 
            html = "";

        html = this.parseHTML(html);

        if (jpf.isIE) {
            this.oDoc.innerHTML = html;
        }
        else if (jpf.isSafari) {
            this.oDoc.innerHTML = html;
            this.oDoc.designMode = "on";
        }
        else {
            this.oDoc.body.innerHTML = html;
            if (jpf.isGecko) {
                var oNode, oParent = this.oDoc.body;
                while (oParent.childNodes.length) {
                    oNode = oParent.firstChild;
                    if (oNode.nodeType == 1) {
                        if (oNode.nodeName == "BR"
                          && oNode.getAttribute('_moz_editor_bogus_node') == "TRUE") {
                            this.Selection.selectNode(oNode);
                            this.Selection.remove();
                            this.Selection.collapse(false);
                            break;
                        }
                    }
                    oParent = oNode;
                }
            }
        }
        
        this.dispatchEvent('onsethtml', {editor: this});
        
        this.setFocus();
    };
    this.$propHandlers["imagehandles"] = function(value){
        
    };
    this.$propHandlers["tablehandles"] = function(value){
        
    };
    this.$propHandlers["output"] = function(value){
        //@todo Update XML
    };
    this.$propHandlers["plugins"] = function(value){
        this.$plugins = value && value.splitSafe(value) || null;
    };
    
    /**
     * Important function; tells the right <i>iframe</i> element that it may be edited by the user.
     * @type void
     */
    this.makeEditable = function() {
        var justinited = false;
        if (!inited) {
            this._attachBehaviors();
            inited = justinited = true;
        }
        if (jpf.isIE) {
            this.oDoc.contentEditable = true;
        }
        else {
            try {
                this.oDoc.designMode = 'on';
                if (jpf.isGecko) {
                    var c = this.Selection.getContext();
                    // Tell Gecko (Firefox 1.5+) to enable or not live resizing of objects
                    c.execCommand('enableObjectResizing', false, this.imagehandles);
                    // Disable the standard table editing features of Firefox.
                    c.execCommand('enableInlineTableEditing', false, this.tablehandles);
                }
            }
            catch (e) {};
        }
        if (justinited) {
            this.$propHandlers["value"].call(this, "");
            this.dispatchEvent('oncomplete', {editor: this});
            complete = true;
        }
    };

    /**
     * Give or return the focus to the editable area.
     * @type void
     */
    var bHasFocus = false;
    this.setFocus = function(bNotify) {
        if (bHasFocus && !jpf.isIE) return;
        if (typeof bNotify == "undefined")
            bNotify = true;
        if (!jpf.isIE) {
            try {
                this.oWin.focus();
                bHasFocus = true;
                //this.oDoc.focus();
            }
            catch(e) {};
        }
        else {
            try {
                this.oDoc.focus();
                bHasFocus = true;
            }
            catch(e) {};
        }
        if (bNotify)
            this.notifyAll();
    };

    /**
     * Give or return the focus to the editable area.
     * @type void
     */
    this.setBlur = function(e) {
        this.dispatchEvent('onblurhandle', {editor: this});
    };
    
    /**
    * Returns the viewport of the Editor window.
    *
    * @return {Object} Viewport object with fields x, y, w and h.
    * @type   {Object}
    */
    this.getViewPort = function() {
        var doc = (!this.oWin.document.compatMode || this.oWin.document.compatMode == 'CSS1Compat')
            ? this.oWin.document.html || this.oWin.document.documentElement //documentElement for an iframe
            : this.oWin.document.body;

        // Returns viewport size excluding scrollbars
        return {
            x     : this.oWin.pageXOffset || doc.scrollLeft,
            y     : this.oWin.pageYOffset || doc.scrollTop,
            width : this.oWin.innerWidth  || doc.clientWidth,
            height: this.oWin.innerHeight || doc.clientHeight
        };
    };

    /**
     * API; get the (X)HTML that's inside the Editor at any given time
     * @param {String} returnType This may be left empty or set to 'dom' or 'text'
     * @see Editor
     * @type mixed
     */
    this.getXHTML = function(output) {
        if (!output) output = this.output;
        if (output == "text")
            return !jpf.isIE ? this.oDoc.body.innerHTML : this.oDoc.innerHTML;
        else
            return !jpf.isIE ? this.oDoc.body : this.oDoc;
    };

    /**
     * API; 'saves' the contents of the content editable area to our hidden textarea.
     *
     * @return The string of (X)HTML that is inside the editor.
     * @type {String}
     */
    this.getValue = function() {
        return this.parseHTML(this.getXHTML('text')).replace(/<br\/?>/gi, '<br/>\n')
            .replace(/<DIV[^>]*_jpf_placeholder="true">(.*)<\/DIV>/gi, '$1<br/>')
            .replace(/<BR[^>]*_jpf_placeholder="true"\/?>/gi, '');

    };

    /**
     * API; replace the (X)HTML that's inside the Editor with something else
     *
     * @param {String} html
     * @type void
     */
    this.setHTML = function(html) {
        this.$propHandlers['value'].call(this, html);
    };

    /**
     * API; insert any given text (or HTML) at cursor position into the Editor
     * @param {String} html
     * @type void
     */
    this.insertHTML = function(html) {
        if (inited && complete) {
            this.setFocus();
            this.Selection.setContent(this.parseHTML(html));
        }
    };
    
    this.parseHTML = function(html) {
        // Convert strong and em to b and i in FF since it can't handle them
        if (jpf.isGecko) {
            html = html.replace(/<(\/?)strong>|<strong( [^>]+)>/gi, '<$1b$2>');
            html = html.replace(/<(\/?)em>|<em( [^>]+)>/gi, '<$1i$2>');
        }
        else if (jpf.isIE)
            html = html.replace(/&apos;/g, '&#39;'); // IE can't handle apos

        // Fix some issues
        html = html.replace(/<a( )([^>]+)\/>|<a\/>/gi, '<a$1$2></a>')
            .replace(/<p([^>]+)>/gi, jpf.editor.ALTP.start)
            .replace(/<\/p>/gi, jpf.editor.ALTP.end);

        return html;
    };
    
    /**
     * Issue a command to the editable area.
     * @param {String} cmdName
     * @param {mixed} cmdParam
     * @type void
     */
    this.executeCommand = function(cmdName, cmdParam) {
        if (!this.Plugins.isPlugin(cmdName) && inited && complete) {
            if (jpf.isIE) {
                if (!this.oDoc.innerHTML)
                    return commandQueue.push([cmdName, cmdParam]);
                //this.Selection.selectNode(this.oDoc);
            }
            this.setFocus(false);
            this.Selection.getContext().execCommand(cmdName, false, cmdParam);
            if (jpf.isIE) {
                //this.Selection.collapse(true);
                // make sure that the command didn't leave any <P> tags behind...cleanup
                if ((cmdName == "InsertUnorderedList" || cmdName == "InsertOrderedList")
                  && this.getCommandState(cmdName) == jpf.editor.OFF) {
                    this.oDoc.innerHTML = this.parseHTML(this.oDoc.innerHTML);
                }
                this.setFocus(false);
            }
            this.notifyAll();
        }
    };
    
    /**
     * Get the state of a command (on, off or disabled)
     * 
     * @param {String} cmdName
     * @type Number
     */
    this.getCommandState = function(cmdName) {
        if (jpf.isGecko && (cmdName == "paste" || cmdName == "copy" || cmdName == "cut"))
            return jpf.editor.DISABLED;
        try {
            if (!this.Selection.getContext().queryCommandEnabled(cmdName))
                return jpf.editor.DISABLED;
            else
                return this.Selection.getContext().queryCommandState(cmdName) 
                    ? jpf.editor.ON
                    : jpf.editor.OFF ;
        }
        catch (e) {
            return jpf.editor.OFF;
        }
    };

    this.showPopup = function(oPlugin, sCacheId, oRef, iWidth, iHeight) {
        if (jpf.popup.last && jpf.popup.last != sCacheId) {
            var o = jpf.lookup(jpf.popup.last);
            if (o) {
                o.state = jpf.editor.OFF;
                this.notify(o.name, o.state);
            }
        }

        jpf.popup.show(sCacheId, 0, 22, false, oRef, iWidth, iHeight, function(oPopup) {
            if (oPopup.onkeydown) return;
            oPopup.onkeydown = function(e) {
                e = e || window.event;
                var key = e.which || e.keyCode;
                if (key == 13 && typeof oPlugin['submit'] == "function") //Enter
                    oPlugin.submit(new jpf.AbstractEvent(e));
                else if (key == 27)
                    jpf.popup.forceHide();
            }
        }, true);
        oPlugin.state = jpf.editor.ON;
        this.notify(oPlugin.name, jpf.editor.ON);
    };

    /**
     * Paste (clipboard) data into the Editor
     * @see Editor#insertHTML
     * @param {String} html Optional.
     * @type void
     */
    function onPaste(e) {
        var sText = "";
        // Get plain text data
        if (e.clipboardData)
            sText = e.clipboardData.getData('text/plain');
        else if (jpf.isIE)
            sText = window.clipboardData.getData('Text');
        sText = sText.replace(/\n/g, '<br />');
        this.insertHTML(sText);
        if (e && jpf.isIE)
            e.stop();
    }

    /**
     * Event handler; fired when the user clicked inside the editable area.
     * @param {Event} e
     * @type void
     */
    var oBookmark, oRange;
    function onClick(e) {
        if (oBookmark && jpf.isGecko) {
            var oNewBm = this.Selection.getBookmark();
            //window.console.dir(this.Selection.getRange());
            if (typeof oNewBm.start == "undefined" && typeof oNewBm.end == "undefined") {
                //this.Selection.moveToBookmark(oBookmark);
                //RAAAAAAAAAAH stoopid firefox, work with me here!!
            }
        }
        jpf.popup.forceHide();
        if (e.rightClick)
            return onContextmenu.call(this, e);
        this.setFocus();
        e.stop();
    }

    function onMousedown(e) {
        if (jpf.isGecko) {
            oBookmark = this.Selection.getBookmark();
            oRange    = this.Selection.getRange();
        }
    }

    /**
     * Event handler; fired when the user right clicked inside the editable area
     * @param {Event} e
     * @type void
     */
    function onContextmenu(e) {
        this.Plugins.notifyAll('oncontext', e);
        this.dispatchEvent('oncontextmenu', {editor: this});
        this.setFocus();
    }
    
    /**
     * Event handler; fired when the user presses a key inside the editable area
     * @param {Event} e
     * @type void
     */
    function onKeydown(e) {
        var i, found;
        if (jpf.isIE) {
            if (commandQueue.length > 0 && this.oDoc.innerHTML.length > 0) {
                for (i = 0; i < commandQueue.length; i++)
                    this.executeCommand(commandQueue[i][0], commandQueue[i][1]);
                commandQueue = [];
            }
            switch(e.code) {
                case 13: //Enter
                    if (!(e.control || e.alt || e.shift)) {
                        // replace paragraphs with divs
                        var oNode = this.Selection.moveToAncestorNode('div'), found = false;
                        if (oNode && oNode.getAttribute('_jpf_placeholder')) {
                            found = true;
                            var oDiv = document.createElement('div');
                            oDiv.setAttribute('_jpf_placeholder', 'true');
                            oDiv.style.display = 'block';
                            oDiv.innerHTML     = jpf.editor.ALTP.text;
                            if (oNode.nextSibling)
                                oNode.parentNode.insertBefore(oDiv, oNode.nextSibling);
                            else
                                oNode.parentNode.appendChild(oDiv);
                        }
                        else
                            this.insertHTML(jpf.editor.ALTP.start + jpf.editor.ALTP.text + jpf.editor.ALTP.end);
                        this.Selection.collapse(true);
                        var range = this.Selection.getRange();
                        range.findText(jpf.editor.ALTP.text, found ? 1 : -1, 0);
                        range.select();
                        this.Selection.remove();

                        e.stop();
                        this.dispatchEvent('onkeyenter', {editor: this});
                        return false;
                    }
                    break;
                case 8: //Backspace
                    if (this.Selection.getType() == 'Control') {
                        this.Selection.remove();
                        return false ;
                    }
                    break;
                case 9: //Tab
                    break;
            }
        }
        else {
            this.setFocus(false);
            if ((e.control || (jpf.isMac && e.meta)) && !e.shift && !e.alt) {
                found = false;
                switch (e.code) {
                    case 66 :	// B
                    case 98 :	// b
                        this.executeCommand('Bold');
                        found = true;
                        break;
                    case 105 :	// i
                    case 73 :	// I
                        this.executeCommand('Italic');
                        found = true;
                        break;
                    case 117 :	// u
                    case 85 :	// U
                        this.executeCommand('Underline');
                        found = true;
                        break;
                    case 86 :	// V
                    case 118 :	// v
                        if (!jpf.isGecko)
                            onPaste.call(this);
                        //found = true;
                        break ;
                }
                if (found)
                    e.stop();
            }
            else if (!e.control && !e.shift && e.code == 13)
                this.dispatchEvent('onkeyenter', {editor: this, event: e});
        }
        if (e.meta || e.control || e.alt || e.shift) {
            found = this.Plugins.notifyKeyBindings(e);
            if (found) {
                e.stop();
                return false;
            }
        }
    }

    var keyupTimer = null;
    /**
     * Event handler; fired when the user releases a key inside the editable area
     * @param {Event} e
     * @type void
     */
    function onKeyup(e) {
        if (keyupTimer != null) 
            return true;

        function keyHandler() {
            clearTimeout(keyupTimer);
            _self.notifyAll();
            _self.dispatchEvent('ontyping', {editor: _self, event: e});
            _self.Plugins.notifyAll('onTyping', e.code);
            keyupTimer = null;
        }

        keyupTimer = window.setTimeout(keyHandler, 100);
        //keyHandler();

        return true;
    }
    
    this.$focus = function() {
        _self = this;
        setTimeout(function() {
            _self.setFocus();
        }, 1);
    };

    this.$blur = function(){
        jpf.popup.forceHide();
        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
    };

    /**
    * Add various event handlers to a <i>Editor</i> object.
    * @type void
    */
    this._attachBehaviors = function() {
        jpf.AbstractEvent.addListener(this.oDoc, 'contextmenu', onContextmenu.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.oDoc, 'mouseup', onClick.bindWithEvent(this));
        //jpf.AbstractEvent.addListener(this.oDoc, 'select', onClick.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.oDoc, 'keyup', onKeyup.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.oDoc, 'keydown', onKeydown.bindWithEvent(this));
        if (!jpf.isIE) {
            jpf.AbstractEvent.addListener(this.oDoc, 'mousedown', function(e) {
                document.onmousedown(e);
            });
            jpf.AbstractEvent.addListener(this.oDoc, 'focus', function(e) {
                window.onfocus(e);
            });
            jpf.AbstractEvent.addListener(this.oDoc, 'blur', function(e) {
                window.onblur(e);
            });
            // @todo: detach this in the $destroy function...
            this.iframe.host = this;
        }

        jpf.AbstractEvent.addListener(this.oDoc, 'paste', onPaste.bindWithEvent(this));
    };
    
    /**** Button Handling ****/
    
    function buttonEnable() {
        jpf.setStyleClass(this, 'editor_enabled', 
            ['editor_selected', 'editor_disabled']);
        this.disabled = false;
    }

    function buttonDisable() {
        jpf.setStyleClass(this, 'editor_disabled', 
            ['editor_selected', 'editor_enabled']);
        this.disabled = true;
    }

    this.$buttonClick = function(e, oButton) {
        var item = oButton.getAttribute("type");
        
        //context 'this' is the buttons' DIV domNode reference
        if (!e._bogus) {
            e.isPlugin = _self.Plugins.isPlugin(item);
            e.state    = getState(item, e.isPlugin);
        }
 
        if (e.state == jpf.editor.DISABLED) {
            buttonDisable.call(oButton);
            _self.editorState = jpf.editor.DISABLED;
        }
        else {
            _self.editorState = jpf.editor.ON;
            
            if (this.disabled) 
                buttonEnable.call(oButton);

            if (e.state == jpf.editor.ON) {
                jpf.setStyleClass(oButton, 'editor_selected');
                oButton.selected = true;
            }
            else {
                jpf.setStyleClass(oButton, '', ['editor_selected']);
                oButton.selected = false;
            }

            if (!e._bogus) {
                if (e.isPlugin)
                    _self.Plugins.get(item).execute(_self);
                else
                    _self.executeCommand(item);
                e.state = getState(item, e.isPlugin);
            }
            
            
        }
    };
    
    function getState(id, isPlugin) {
        if (isPlugin) {
            var plugin = _self.Plugins.get(id);
            return plugin.queryState
                ? plugin.queryState(_self)
                : _self.editorState;
        }

        return _self.getCommandState(id);
    }

    /**
     * Notify a specific button item on state changes (on, off, disabled, visible or hidden)
     * @param {String} cmdName
     * @param {String} state
     * @type void
     */
    this.notify = function(item, state) {
        var oButton = oButtons[item];
        if (!oButton)
            return;
        
        if (typeof state == "undefined")
            state = this.getCommandState(item);
        
        if (state == jpf.editor.DISABLED)
            buttonDisable.call(oButton);
        else if (state == jpf.editor.HIDDEN)
            oButton.style.display = "none";
        else if (state == jpf.editor.VISIBLE)
            oButton.style.display = "";
        else {
            var oPlugin = this.Plugins.get(item);
            if (oPlugin && oPlugin.queryState)
                state = oPlugin.queryState(this);
            
            if (oButton.style.display == 'none')
                oButton.style.display = "";
            
            if (oButton.disabled)
                buttonEnable.call(oButton);
            
            var btnState = (oButton.selected) 
                ? jpf.editor.ON 
                : jpf.editor.OFF;

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
     * @type void
     */
    this.notifyAll = function() {
        for (var item in oButtons) {
            this.notify(item);
        }
    };
    
    /**** Init ****/
    
    /**
     * Draw all HTML elements for the Editor.Toolbar
     * @see Editor.Toolbar
     * @type void
     */
    function drawToolbars(oParent) {
        var tb, l, k, i, j, z, node, buttons, bIsPlugin;
        var item, bNode, oNode = this.$getOption('toolbars');
        var plugin, oButton, plugins = this.Plugins;
        
        for (i = 0, l = oNode.childNodes.length; i < l; i++) {
            node = oNode.childNodes[i];
            if (node.nodeType != 1)
                continue;
                
            //#ifdef __DEBUG
            if (node[jpf.TAGNAME] != "toolbar") {
                throw new Error(jpf.formatErrorString(0, this,
                    "Creating toolbars",
                    "Invalid element found in toolbars definition", 
                    node));
            }
            //#endif
            
            for (j = 0, k = node.childNodes.length; j < k; j++) {
                bNode = node.childNodes[j];
                
                //#ifdef __DEBUG;
                if (bNode.nodeType != 3 && bNode.nodeType != 4) {
                    throw new Error(jpf.formatErrorString(0, this,
                        "Creating toolbars",
                        "Invalid element found in toolbar definition", 
                        bNode));
                }
                //#endif
                
                buttons = bNode.nodeValue.splitSafe(",", -1, true);
            }
            
            if (!buttons || !buttons.length)
                continue;
            
            this.$getNewContext("toolbar");
            tb = oParent.insertBefore(this.$getLayoutNode("toolbar"), oParent.lastChild);

            for (z = 0; z < buttons.length; z++) {
                item = buttons[z];
            
                if (item == "|") { //seperator!
                    this.$getNewContext("divider");
                    tb.appendChild(this.$getLayoutNode("divider"));
                }
                else {
                    this.$getNewContext("button");
                    oButton = tb.appendChild(this.$getLayoutNode("button"));

                    bIsPlugin = false;
                    if (!this.$nativeCommands.contains(item)) {
                        plugin = plugins.add(item);
                        // #ifdef __DEBUG
                        if (!plugin)
                            jpf.console.error('Plugin \'' + item + '\' can not \
                                               be found and/ or instantiated.',
                                               'editor');
                        // #endif
                        bIsPlugin = true;
                    }
                    
                    if (bIsPlugin) {
                        plugin = plugin || plugins.get(item);
                        if (!plugin)
                            continue;
                        if (plugin.type != jpf.editor.TOOLBARITEM) 
                            continue;
                        
                        this.$getLayoutNode("button", "label", oButton)
                            .setAttribute("class", 'editor_icon editor_' + plugin.icon);
                        
                        oButton.setAttribute(plugin.subtype == jpf.editor.TOOLBARPANEL 
                            ? "onmousedown" 
                            : "onclick", "jpf.findHost(this).$buttonClick(event, this);");
                        
                        oButton.setAttribute("title", plugin.name);
                    }
                    else {
                        this.$getLayoutNode("button", "label", oButton)
                            .setAttribute("class", 'editor_icon editor_' + item);
                        
                        oButton.setAttribute("onclick", 
                            "jpf.findHost(this).$buttonClick(event, this);");
                        oButton.setAttribute("title", item);
                    }
                    
                    oButton.setAttribute("type", item);
                }
            }
            
            buttons = null;
        }
    };

    /**
     * Draw all the HTML elements at startup time.
     * @type void
     */
    this.$draw = function() {
        if (this.jml.getAttribute("plugins")) {
            this.$propHandlers["plugins"]
                .call(this, this.jml.getAttribute("plugins"));
        }
        
        this.Plugins   = new jpf.editor.Plugins(this.$plugins, this);
        this.Selection = new jpf.editor.Selection(this);
        
        this.oExt = this.$getExternal("main", null, function(oExt){
            drawToolbars.call(this, this.$getLayoutNode("main", "toolbar"));
        });
        this.oToolbar = this.$getLayoutNode("main", "toolbar", this.oExt);
        var oEditor   = this.$getLayoutNode("main", "editor",  this.oExt);
        
        // fetch the DOM references of all toolbar buttons and let the
        // respective plugins finish initialization
        var btns = this.oToolbar.getElementsByTagName("a");
        for (var item, plugin, i = 0; i < btns.length; i++) {
            item = btns[i].getAttribute("type");
            
            oButtons[item] = btns[i];
            plugin = this.Plugins.coll[item];
            if (!plugin)
                continue;
            
            plugin.buttonNode = btns[i];

            if (plugin.init)
                plugin.init(this);
        }
        
        if (!jpf.isIE) {
            this.iframe = document.createElement('iframe');
            this.iframe.setAttribute('frameborder', 'no');
            //this.iframe.className = oEditor.className;
            //oEditor.parentNode.replaceChild(this.iframe, oEditor);
            oEditor.appendChild(this.iframe);
            this.oWin = this.iframe.contentWindow;
            this.oDoc = this.oWin.document;
            this.oDoc.open();
            this.oDoc.write('<?xml version="1.0" encoding="UTF-8"?>\
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">\
                <html>\
                <head>\
                    <title></title>\
                    <style type="text/css">\
                    html{\
                        cursor : text;\
                    }\
                    body\
                    {\
                        margin: 0;\
                        padding: 0;\
                        color: Black;\
                        font-family: Verdana;\
                        font-size: 10pt;\
                        background:#fff;\
                        word-wrap: break-word;\
                    }\
                    .itemAnchor\
                    {\
                        background:url(skins/images/editor/items.gif) no-repeat left bottom;\
                        line-height:6px;\
                        overflow:hidden;\
                        padding-left:12px;\
                        width:12px;\
                    }\
                    table.itemTable,\
                    table.itemTable td\
                    {\
                        border: 1px dashed #bbb;\
                    }\
                    table.itemTable td\
                    {\
                        margin: 8px;\
                    }\
                    </style>\
                </head>\
                <body></body>\
                </html>');
            this.oDoc.close();
        }
        else {
            this.oWin = window;
            this.oDoc = oEditor;
        }

        // do the magic, make the editor editable.
        this.makeEditable();
    };

    /**
     * Parse the block of JML that constructed this editor instance for arguments
     * like width, height, etc.
     * 
     * @param {XMLRootElement} x
     * @type {void}
     */
    this.$loadJml = function(x){
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);

        if (jpf.xmldb.isOnlyChild(x.firstChild, [3,4]))
            this.$handlePropSet("value", x.firstChild.nodeValue.trim());
        else
            jpf.JmlParser.parseChildren(this.jml, null, this);
        
        this.oExt.style.paddingTop    = this.oToolbar.offsetHeight + 'px';
        this.oToolbar.style.marginTop = (-1 * this.oToolbar.offsetHeight) + 'px';
    };
}).implement(
     //#ifdef __WITH_VALIDATION
    jpf.Validation,
    //#endif
    //#ifdef __WITH_XFORMS
    jpf.XForms,
    //#endif
    //#ifdef __WITH_DATABINDING
    jpf.DataBinding,
    //#endif
    jpf.Presentation
);

jpf.editor.ON             = 1;
jpf.editor.OFF            = 0;
jpf.editor.DISABLED       = -1;
jpf.editor.VISIBLE        = 2;
jpf.editor.HIDDEN         = 3;
jpf.editor.SELECTED       = 4;
jpf.editor.ALTP           = {
    start: '<div style="display:block;visibility:hidden;" _jpf_placeholder="true">',
    end  : '</div>',
    text : '{jpf_placeholder}'
};

// #endif
