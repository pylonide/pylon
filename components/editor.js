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

jpf.editor = jpf.component(jpf.GUI_NODE, function() {
    var inited, complete, buttons = {};
    
    /**** Default Properties ****/
    
    var htmlId       = 'editor_' + this.uniqueId;
    var commandQueue = [];
    var toolbars     = [];
    var _self        = this;
    
    //@todo Make the this.buttons array authorative for button based plugin loading
    this.editorState          = jpf.editor.ON;
    this.buttons              = ['Bold', 'Italic', 'Underline', 'Smilies'];
    this.__plugins            = ['fonts', 'fontsize', 'pastetext', 'pasteword',
                                'forecolor', 'backcolor', 'hr', 'search',
                                'replace', 'bullist', 'numlist', 'blockquote',
                                'link', 'unlink', 'anchor', 'code', 'insertdate',
                                'inserttime', 'sub', 'sup', 'charmap', 'emotions'];
    this.__classToolbar       = 'editor_Toolbar';
    
    /**** Properties and Attributes ****/
    
    //this.forceVScrollIE       = true;
    //this.UseBROnCarriageReturn= true;
    this.imagehandles = false;
    this.tablehandles = false;
    this.output       = 'text'; //can be 'text' or 'dom', if you want to retrieve an object.
    
    this.__supportedProperties.push("value", "imagehandles", "tablehandles",
        "output");

    this.__propHandlers["value"] = function(html){
        if (!inited || !complete)
            return;
            
        if (typeof html == "undefined") 
            html = "";
            
        html = this.parseHTML(html);

        if (jpf.isIE) {
            this.oDoc.innerHTML = html;
            var oParent = this.oDoc;
            while (oParent.hasChildNodes()) {
                if (oParent.lastChild.nodeType == 1) {
                    if (oParent.lastChild.nodeName == "BR"
                        && oParent.lastChild.getAttribute('_ie_placeholder') == "TRUE") {
                        this.Selection.selectNode(oParent.lastChild);
                        this.Selection.remove();
                        this.Selection.collapse(false);
                        break;
                    }
                }
                oParent = oParent.lastChild;
            }
        }
        else if (jpf.isSafari) {
            this.oDoc.innerHTML = html;
            this.oDoc.designMode = "on";
        }
        else {
            this.oDoc.body.innerHTML = html;
        }
        
        this.dispatchEvent('onsethtml', {editor: this});
        
        this.setFocus();
    };
    this.__propHandlers["imagehandles"] = function(value){
        
    };
    this.__propHandlers["tablehandles"] = function(value){
        
    };
    this.__propHandlers["output"] = function(value){
        //@todo Update XML
    };
    this.__propHandlers["plugins"] = function(value){
        this.__plugins = value && value.splitSafe(value) || null;
    };
    
    /**
     * Important function; tells the right <i>iframe</i> element that it may be edited by the user.
     * @type void
     */
    this.makeEditable = function() {
        var justinited = false;
        if (!inited) {
            this._attachBehaviors();
            inited = true;
            justinited   = true;
        }
        if (jpf.isIE) {
            this.oDoc.contentEditable = true;
        }
        else {
            try {
                this.oDoc.designMode = 'on';
                if (jpf.isGecko) {
                    // Tell Gecko (Firefox 1.5+) to enable or not live resizing of objects (by Alfonso Martinez)
                    this.oDoc.execCommand('enableObjectResizing', false, this.imageHandles);
                    // Disable the standard table editing features of Firefox.
                    this.oDoc.execCommand('enableInlineTableEditing', false, this.tableHandles);
                }
            }
            catch (e) {};
        }
        if (justinited) {
            this.__propHandlers["value"].call(this, "");
            this.dispatchEvent('oncomplete', {editor: this});
            complete = true;
        }
    };

    /**
     * Give or return the focus to the editable area.
     * @type void
     */
    this.setFocus = function(bNotify) {
        if (typeof bNotify == "undefined")
            bNotify = true;
        if (!jpf.isIE) {
            try {
                this.oWin.focus();
                //this.oDoc.focus();
            }
            catch(e) {};
        }
        else {
            try {
                this.oDoc.focus();
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
    this.save = function() {
        this.linkedField.value = this.parseHTML(this.getXHTML('text'));
        return this.linkedField.value;
    };

    /**
     * API; replace the (X)HTML that's inside the Editor with something else
     * 
     * @param {String} html
     * @type void
     */
    this.setHTML = function(html) {
        this.setProperty("value", html);
    };
    
    /**
     * API; insert any given text (or HTML) at cursor position into the Editor
     * @param {String} html
     * @type void
     */
    this.insertHTML = function(html) {
        if (inited && complete) {
            this.setFocus();
            this.Selection.setContent(html);
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
    }
    
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

    this.hidePopup = function() {
        jpf.Popup.hide();
        var plugins = this.Plugins.getByType(jpf.editor.TOOLBARPANEL);
        this.activePlugin = null;
        for (var i = 0; i < plugins.length; i++) {
            plugins[i].state = jpf.editor.OFF;
        }
        this.notifyAll();
    }

    this.showPopup = function(oPlugin, sCacheId, oRef, iWidth, iHeight) {
        var _self = this;
        if (this.activePlugin && this.activePlugin != oPlugin) {
            this.activePlugin.state = jpf.editor.OFF;
            this.notify(oPlugin.name, jpf.editor.OFF);
        }
        jpf.Popup.show(sCacheId, 0, 24, false, oRef, iWidth, iHeight, function(oPopup) {
            if (oPopup.onkeydown) return;
            oPopup.onkeydown = function(e) {
                e = e || window.event;
                var key = e.which || e.keyCode;
                if (key == 13 && typeof oPlugin['submit'] == "function") //Enter
                    oPlugin.submit(new jpf.AbstractEvent(e));
                else if (key == 27)
                    _self.hidePopup();
            }
        }, true);
        this.activePlugin = oPlugin;
        oPlugin.state     = jpf.editor.ON;
        this.notify(oPlugin.name, jpf.editor.ON);
    }

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
    };

    /**
     * Event handler; fired when the user clicked inside the editable area.
     * @param {Event} e
     * @type void
     */
    function onClick(e) {
        this.hidePopup();
        if (e.rightClick)
            return onContextmenu.call(this, e);
        this.setFocus();
    };

    /**
     * Event handler; fired when the user right clicked inside the editable area
     * @param {Event} e
     * @type void
     */
    function onContextmenu(e) {
        this.dispatchEvent('oncontextmenu', {editor: this});
        this.setFocus();
    };
    
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
    
    this.__focus = function() {
        _self = this;
        setTimeout(function() {
            _self.setFocus();
        }, 1);
    }

    this.__blur = function(){
        this.hidePopup();
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
    }

    /**
    * Add various event handlers to a <i>Editor</i> object.
    * @type void
    */
    this._attachBehaviors = function() {
        jpf.AbstractEvent.addListener(this.oDoc, 'contextmenu', onContextmenu.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.oDoc, 'mouseup', onClick.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.oDoc, 'select', onClick.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.oDoc, 'keyup', onKeyup.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.oDoc, 'keydown', onKeydown.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.oDoc, 'focus', this.setFocus.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.oDoc, 'blur', this.setBlur.bindWithEvent(this));

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

    this.__buttonClick = function(e, oButton) {
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
    }
    
    function getState(id, isPlugin) {
        if (isPlugin) {
            var plugin = _self.Plugins.get(id);
            return plugin.queryState
                ? plugin.queryState(_self)
                : _self.editorState;
        }

        return _self.getCommandState(id);
    }

    function lookupButton(item){
        
    }

    /**
     * Notify a specific button item on state changes (on, off, disabled, visible or hidden)
     * @param {String} cmdName
     * @param {String} state
     * @type void
     */
    this.notify = function(item, state) {
        var oButton = buttons[item];
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
                this.__buttonClick({
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
        for (var item in buttons) {
            this.notify(item);
        }
    };
    
    /**** Init ****/
    
    /**
     * Draw all HTML elements for the Editor.Toolbar
     * @see Editor.Toolbar
     * @type void
     */
    function drawToolbar(oParent) {
        var tb, l, k, i, j, z, node, buttons;
        var item, bNode, oNode = this.__getOption('toolbars');
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
            
            this.__getNewContext("toolbar");
            tb = oParent.insertBefore(this.__getLayoutNode("toolbar"), 
                oParent.lastChild);

            for (z = 0; z < buttons.length; z++) {
                item = buttons[z];
            
                if (item == "|") { //seperator!
                    this.__getNewContext("divider");
                    tb.appendChild(this.__getLayoutNode("divider"));
                }
                else {
                    this.__getNewContext("button");
                    oButton = tb.appendChild(this.__getLayoutNode("button"));
                    
                    if (plugins.isPlugin(item)) {
                        plugin = plugins.get(item);
                        if (plugin.type != jpf.editor.TOOLBARITEM) 
                            continue;
                        
                        this.__getLayoutNode("button", "label", oButton)
                            .setAttribute("class", 'editor_icon editor_' + plugin.icon);
                        
                        oButton.setAttribute(plugin.subtype == jpf.editor.TOOLBARPANEL 
                            ? "onmousedown" 
                            : "onclick", "jpf.findHost(this).__buttonClick(event, this)");
                        
                        oButton.setAttribute("title", plugin.name);
                    }
                    else {
                        this.__getLayoutNode("button", "label", oButton)
                            .setAttribute("class", 'editor_icon editor_' + item);
                        
                        oButton.setAttribute("onclick", 
                            "jpf.findHost(this).__buttonClick(event, this)");
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
    this.draw = function() {
        if (this.jml.getAttribute("plugins")) {
            this.__propHandlers["plugins"]
                .call(this, this.jml.getAttribute("plugins"));
        }
        
        this.Plugins   = new jpf.editor.Plugins(this.__plugins, this);
        this.Selection = new jpf.editor.Selection(this);
        
        this.oExt = this.__getExternal("main", null, function(oExt){
            drawToolbar.call(this, this.__getLayoutNode("main", "toolbar"));
        });
        this.oToolbar = this.__getLayoutNode("main", "toolbar", this.oExt);
        var oEditor   = this.__getLayoutNode("main", "editor", this.oExt);
        
        var btns = this.oToolbar.getElementsByTagName("a");
        for (var item, plugin, i = 0; i < btns.length; i++) {
            item = btns[i].getAttribute("type");
            
            buttons[item] = btns[i];
            plugin = this.Plugins.coll[item];
            if (!plugin)
                continue;
            
            plugin.buttonNode    = btns[i];
            
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
        
        this.linkedField = this.__getLayoutNode("main", "linked", this.oExt);
        this.linkedField.value = this.value;

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
    this.__loadJml = function(x){
        this.oInt = this.__getLayoutNode("main", "container", this.oExt);
        
        jpf.JmlParser.parseChildren(this.jml, jpf.isIE
            ? this.oDoc 
            : this.oDoc.body, this);
        
        this.oExt.style.paddingTop = this.oToolbar.offsetHeight + 'px';
        this.oToolbar.style.marginTop = (-1 * this.oToolbar.offsetHeight) + 'px';
        
        /*jpf.layout.setRules(this.oExt, this.uniqueId + "_editor", "\
            var o = jpf.lookup(" + this.uniqueId + ");\
            o.oExt.style.paddingTop = o.oToolbar.offsetHeight + 'px';\
            o.oToolbar.style.marginTop = (-1 * o.oToolbar.offsetHeight) + 'px';\
            ", true);
        jpf.layout.activateRules(this.oExt);*/
    }
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
    start: '<div style="display:block" _jpf_placeholder="true">',
    end  : '</div>',
    text : '{jpf_placeholder}'
};

/**
 * @class jpf.editor.Selection
 * @contructor
 * @extends jpf.editor
 * @author Mike de Boer <mike@javeline.com>
 */
jpf.editor.Selection = function(editor) {
    /**
     * Initialize the Editor.Selection class.
     * 
     * @type Editor.Selection
     */
    this.editor = editor;
    
    this.getContext = function() {
        if (jpf.isIE)
            return document.selection.createRange();
        else
            return this.editor.oDoc;
    }

    /**
     * Get the selection of the editable area
     * 
     * @type Range
     */
    this.getSelection = function() {
        return document.selection 
            ? document.selection
            : this.editor.oWin.getSelection()
    };
    
    this.getRange = function() {
        var sel = this.getSelection(), range;

        try {
            if (sel)
                range = sel.rangeCount > 0
                    ? sel.getRangeAt(0)
                    : (sel.createRange
                        ? sel.createRange()
                        : this.editor.oDoc.createRange());
        }
        // IE throws unspecified error here if we're placed in a frame/iframe
        catch (ex) {}

        // No range found then create an empty one
        // This can occur when the editor is placed in a hidden container element on Gecko
        // Or on IE when there was an exception
        if (!range)
            range = jpf.isIE
                ? document.body.createTextRange()
                : this.editor.oDoc.createRange();

        return range;
    };

    this.setRange = function(range) {
        if (!jpf.isIE) {
            var sel = this.getSelection();

            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
        else {
            try {
                range.select();
            }
            // Needed for some odd IE bug #1843306
            catch (ex) {}
        }
    };
    
    /**
     * Returns a bookmark location for the current selection. This bookmark object
     * can then be used to restore the selection after some content modification to the document.
     *
     * @param {bool}    type Optional State if the bookmark should be simple or not. Default is complex.
     * @return {Object} Bookmark object, use moveToBookmark with this object to restore the selection.
     */
    this.getBookmark = function(type) {
        var range    = this.getRange();
        var viewport = this.editor.getViewPort();

        // Simple bookmark fast but not as persistent
        if (type == 'simple')
            return {range : range, scrollX : viewport.x, scrollY : viewport.y};
        
        var oEl, sp, bp, iLength;
        var oRoot = jpf.isIE ? this.editor.oDoc : this.editor.oDoc.body;

        // Handle IE
        if (jpf.isIE) {
            // Control selection
            if (range.item) {
                oEl = range.item(0);

                var aNodes = this.editor.oDoc.getElementsByTagName(oEl.nodeName);
                for (var i = 0; i < aNodes.length; i++) {
                    if (oEl == aNodes[i]) {
                        sp = i;
                        break;
                    }
                }
                return {
                    tag     : oEl.nodeName,
                    index   : sp,
                    scrollX : viewport.x,
                    scrollY : viewport.y
                };
            }

            // Text selection
            var tRange = document.body.createTextRange();
            tRange.moveToElementText(oRoot);
            tRange.collapse(true);
            bp = Math.abs(tRange.move('character', -0xFFFFFF));

            tRange = range.duplicate();
            tRange.collapse(true);
            sp = Math.abs(tRange.move('character', -0xFFFFFF));

            tRange = range.duplicate();
            tRange.collapse(false);
            iLength = Math.abs(tRange.move('character', -0xFFFFFF)) - sp;

            return {
                start   : sp - bp,
                length  : iLength,
                scrollX : viewport.x,
                scrollY : viewport.y
            };
        }

        // Handle W3C
        oEl     = this.getSelectedNode();
        var sel = this.getSelection();

        if (!sel)
            return null;

        // Image selection
        if (oEl && oEl.nodeName == 'IMG') {
            return {
                scrollX : viewport.x,
                scrollY : viewport.y
            };
        }

        // Text selection
        var oDoc = jpf.isIE ? window.document : this.editor.oDoc;
        function getPos(sn, en) {
            var w = oDoc.createTreeWalker(oRoot, NodeFilter.SHOW_TEXT, null, false), n, p = 0, d = {};

            while ((n = w.nextNode()) != null) {
                if (n == sn)
                    d.start = p;
                if (n == en) {
                    d.end = p;
                    return d;
                }
                p += (n.nodeValue || '').trim().length;
            }
            return null;
        };
        
        var wb = 0, wa = 0;

        // Caret or selection
        if (sel.anchorNode == sel.focusNode && sel.anchorOffset == sel.focusOffset) {
            oEl = getPos(sel.anchorNode, sel.focusNode);
            if (!oEl)
                return {scrollX : viewport.x, scrollY : viewport.y};
            // Count whitespace before
            (sel.anchorNode.nodeValue || '').trim().replace(/^\s+/, function(a) {
                wb = a.length;
            });

            return {
                start  : Math.max(oEl.start + sel.anchorOffset - wb, 0),
                end    : Math.max(oEl.end + sel.focusOffset - wb, 0),
                scrollX: viewport.x,
                scrollY: viewport.y,
                begin  : sel.anchorOffset - wb == 0
            };
        } else {
            oEl = getPos(range.startContainer, range.endContainer);
            if (!oEl)
                return {scrollX : viewport.x, scrollY : viewport.y};

            return {
                start  : Math.max(oEl.start + range.startOffset - wb, 0),
                end    : Math.max(oEl.end + range.endOffset - wa, 0),
                scrollX: viewport.x,
                scrollY: viewport.y,
                begin  : range.startOffset - wb == 0
            };
        }
    }

    /**
    * Restores the selection to the specified bookmark.
    *
    * @param {Object} bookmark Bookmark to restore selection from.
    * @return {bool} true/false if it was successful or not.
    */
    this.moveToBookmark = function(bmark) {
        var t = this, range = this.getRange(), sel = this.getSelection(), sd, nvl, nv;
        
        var oRoot = jpf.isIE ? this.editor.oDoc : this.editor.oDoc.body;
        if (!bmark)
            return false;

        this.editor.oWin.scrollTo(bmark.scrollX, bmark.scrollY);

        // Handle explorer
        if (jpf.isIE) {
            // Handle simple
            if (range = bmark.range) {
                try {
                    range.select();
                }
                catch (ex) {}
                return true;
            }

            this.editor.setFocus();

            // Handle control bookmark
            if (bmark.tag) {
                range = oRoot.createControlRange();
                var aNodes = this.editor.oDoc.getElementsByTagName(bmark.tag);
                for (var i = 0; i < aNodes.length; i++) {
                    if (i == bmark.index)
                        range.addElement(aNodes[i]);
                }
            }
            else {
                // Try/catch needed since this operation breaks when TinyMCE is placed in hidden divs/tabs
                try {
                    // Incorrect bookmark
                    if (bmark.start < 0)
                        return true;
                    range = sel.createRange();
                    range.moveToElementText(oRoot);
                    range.collapse(true);
                    range.moveStart('character', bmark.start);
                    range.moveEnd('character', bmark.length);
                }
                catch (ex2) {
                    return true;
                }
            }
            try {
                range.select();
            }
            catch (ex) {} // Needed for some odd IE bug #1843306
            return true;
        }

        // Handle W3C
        if (!sel)
            return false;

        // Handle simple
        if (bmark.range) {
            sel.removeAllRanges();
            sel.addRange(bmark.range);
        }
        else if (typeof bmark.start != "undefined" && typeof bmark.end != "undefined") {
            var oDoc = jpf.isIE ? window.document : this.editor.oDoc;
            function getPos(sp, ep) {
                var w = oDoc.createTreeWalker(oRoot, NodeFilter.SHOW_TEXT, null, false)
                var n, p = 0, d = {}, o, wa, wb;

                while ((n = w.nextNode()) != null) {
                    wa  = wb = 0;
                    nv  = n.nodeValue || '';
                    nvl = nv.trim().length;
                    p += nvl;
                    if (p >= sp && !d.startNode) {
                        o = sp - (p - nvl);
                        // Fix for odd quirk in FF
                        if (bmark.begin && o >= nvl)
                            continue;
                        d.startNode = n;
                        d.startOffset = o + wb;
                    }
                    if (p >= ep) {
                        d.endNode = n;
                        d.endOffset = ep - (p - nvl) + wb;
                        return d;
                    }
                }
                return null;
            };

            try {
                sd = getPos(bmark.start, bmark.end);
                if (sd) {
                    range = oDoc.createRange();
                    range.setStart(sd.startNode, sd.startOffset);
                    range.setEnd(sd.endNode, sd.endOffset);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }

                if (!jpf.isOpera)
                    this.editor.setFocus();
            }
            catch (ex) {}
        }
    }
    
    this.getContent = function() {
        var range = this.getRange(), sel = this.getSelection(), prefix, suffix, n;
        var oNode = jpf.isIE ? document.body : this.editor.oDoc.body;

        prefix = suffix = '';

        if (this.editor.output == 'text')
            return this.isCollapsed() ? '' : (range.text || (sel.toString ? sel.toString() : ''));

        if (range.cloneContents) {
            n = range.cloneContents();
            if (n)
                oNode.appendChild(n);
        }
        else if (typeof range.item != "undefined" || typeof range.htmlText != "undefined")
            oNode.innerHTML = range.item ? range.item(0).outerHTML : range.htmlText;
        else
            oNode.innerHTML = range.toString();

        // Keep whitespace before and after
        if (/^\s/.test(oNode.innerHTML))
            prefix = ' ';
        if (/\s+$/.test(oNode.innerHTML))
            suffix = ' ';

        // Note: TinyMCE uses a serializer here, I don't.
        //       prefix + this.serializer.serialize(oNode, options) + suffix;
        return this.isCollapsed() ? '' : prefix + oNode.outerHTML + suffix;
    }
    
    this.setContent = function(html) {
        var range = this.getRange();
        var oDoc = jpf.isIE ? document : this.editor.oDoc;

        html = this.editor.parseHTML(html);

        if (range.insertNode) {
            // Make caret marker since insertNode places the caret in the beginning of text after insert
            html += '<span id="__caret">_</span>';

            // Delete and insert new node
            range.deleteContents();
            range.insertNode(this.getRange().createContextualFragment(html));

            // Move to caret marker
            var oCaret = oDoc.getElementById('__caret');

            // Make sure we wrap it completely, Opera fails with a simple select call
            range = oDoc.createRange();
            range.setStartBefore(oCaret);
            range.setEndAfter(oCaret);
            this.setRange(range);

            // Delete the marker, and hopefully the caret gets placed in the right location
            oDoc.execCommand('Delete', false, null);

            // In case it's still there
            if (oCaret && oCaret.parentNode)
                oCaret.parentNode.removeChild(oCaret);
        }
        else {
            if (range.item) {
                // Delete content and get caret text selection
                this.remove();
                range = this.getRange();
            }

            range.pasteHTML(html);
        }
    }

    /**
     * Get the type of selection of the editable area
     * 
     * @type String
     */
    this.getType = function() {
        var sel = this.getSelection();
        if (jpf.isIE) {
            return sel.type;
        }
        else {
            var type = "Text";
            if (sel && sel.rangeCount == 1) {
                var oRange = sel.getRangeAt(0);
                if (oRange.startContainer == oRange.endContainer
                  && (oRange.endOffset - oRange.startOffset) == 1)
                    type = "Control";
            }
            return type ;
        }
    };

    /**
     * Retrieve the currently selected element from the editable area
     * 
     * @type DOMObject
     * @return Currently selected element or common ancestor element
     */
    this.getSelectedNode = function() {
        var range = this.getRange(), sel = this.getSelection(), oNode;

        if (!jpf.isIE) {
            // Range maybe lost after the editor is made visible again
            if (!range)
                return this.editor.oDoc;

            oNode = range.commonAncestorContainer;

            // Handle selection as image or other control like element such as anchors
            if (!range.collapsed) {
                // If the anchor node is an element instead of a text node then return this element
                if (jpf.isSafari && sel.anchorNode && sel.anchorNode.nodeType == 1)
                    return sel.anchorNode.childNodes[sel.anchorOffset];

                if (range.startContainer == range.endContainer) {
                    if (range.startOffset - range.endOffset < 2) {
                        if (range.startContainer.hasChildNodes())
                            oNode = range.startContainer.childNodes[range.startOffset];
                    }
                }
            }

            oNode = oNode.parentNode;
            while (oNode.nodeType != 1)
                oNode = oNode.parentNode;
            return oNode;
        }

        return range.item ? range.item(0) : range.parentElement();
    };

    /**
     * Retrieve the parent node of the currently selected element from the editable area
     * 
     * @type DOMObject
     */
    this.getParentNode = function() {
        switch (this.getType()) {
            case "Control" :
                if (jpf.isIE)
                    return this.getSelectedNode().parentElement;
                else
                    return this.getSelectedNode().parentNode;
            case "None" :
                return;
            default :
                var sel = this.getSelection();
                if (jpf.isIE) {
                    return sel.createRange().parentElement();
                }
                else {
                    if (sel) {
                        var oNode = sel.anchorNode;
                        while (oNode && oNode.nodeType != 1)
                            oNode = oNode.parentNode;
                        return oNode;
                    }
                }
                break;
        }
    };

    /**
     * Select a specific node inside the editable area
     * 
     * @param {DOMObject} node
     * @type void
     */
    this.selectNode = function(node) {
        this.editor.setFocus();
        var sel = this.getSelection(), range = this.getRange();
        if (jpf.isIE) {
            sel.empty();
            range.moveToElementText(node);
            range.select();
        }
        else {
            range.selectNode(node);
            sel = this.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };
    
    /**
     * Collapse the selection to start or end of range.
     *
     * @param {Boolean} toEnd Optional boolean state if to collapse to end or not. Defaults to start.
     */
    this.collapse = function(toEnd) {
        var range = this.getRange(), n;

        // Control range on IE
        if (range.item) {
            n = range.item(0);
            range = document.body.createTextRange();
            range.moveToElementText(n);
        }

        range.collapse(!!toEnd);
        this.setRange(range);
    };
    
    this.isCollapsed = function() {
        var range = this.getRange(), sel = this.getSelection();

        if (!range || range.item)
            return false;

        return !sel || range.boundingWidth == 0 || range.collapsed;
    };

    /**
     * Check if the currently selected element has any parent node(s) with the specified tagname
     * 
     * @param {String} nodeTagName
     * @type Boolean
     */
    this.hasAncestorNode = function(nodeTagName) {
        var oContainer, range = this.getRange();
        if (this.getType() == "Control" || !jpf.isIE) {
            oContainer = this.getSelectedNode();
            if (!oContainer && !jpf.isIE) {
                try {
                    oContainer = range.startContainer;
                }
                catch(e){}
            }
        }
        else {
            oContainer = range.parentElement();
        }
        while (oContainer) {
            if (jpf.isIE)
                if (oContainer.tagName == nodeTagName)
                    return true;
                else
                if (oContainer.nodeType == 1 && oContainer.tagName == nodeTagName)
                    return true;
            oContainer = oContainer.parentNode;
        }
        return false ;
    };
    
    /**
     * Move the selection to a parent element of the currently selected node with the specified tagname
     * 
     * @param {String} nodeTagName
     * @type void
     */
    this.moveToAncestorNode = function(nodeTagName) {
        var oNode, i, range = this.getRange();
        nodeTagName = nodeTagName.toUpperCase();
        if (jpf.isIE) {
            if (this.getType() == "Control") {
                for (i = 0; i < range.length; i++) {
                    if (range(i).parentNode) {
                        oNode = range(i).parentNode;
                        break;
                    }
                }
            }
            else {
                oNode = range.parentElement();
            }
            while (oNode && oNode.nodeName != nodeTagName)
                oNode = oNode.parentNode;
            return oNode;
        }
        else {
            var oContainer = this.getSelectedNode();
            if (!oContainer)
                oContainer = this.editor.oWin.getSelection().getRangeAt(0).startContainer
            while (oContainer) {
                if (oContainer.tagName == nodeTagName)
                    return oContainer;
                oContainer = oContainer.parentNode;
            }
            return null ;
        }
    };

    /**
     * Remove the currently selected contents from the editable area
     * @type void
     */
    this.remove = function() {
        var oSel = this.getSelection(), i;
        if (jpf.isIE) {
            if (oSel.type.toLowerCase() != "none")
                oSel.clear();
        }
        else if (oSel) {
            for (i = 0; i < oSel.rangeCount; i++)
                oSel.getRangeAt(i).deleteContents();
        }
        return oSel;
    };
};

/**
 * @class Plugins
 * @contructor
 * @extends editor
 * @namespace jpf
 * @author Mike de Boer <mike@javeline.com>
 */
jpf.editor.Plugins = function(coll, editor) {
    /**
     * Initialize the Editor.Plugins class.
     * 
     * @param {Array} coll Collection of plugins that should be searched for and loaded
     * @param {Editor} editor
     * @type Editor.Plugins
     */
    var plugin;
    this.editor = editor;
    this.coll   = {};
    //if (!coll || !coll.length) return;
    if (coll && coll.length) {
        for (var i = 0; i < coll.length; i++) {
            if (jpf.editor.Plugin[coll[i]]) {
                plugin = new jpf.editor.Plugin[coll[i]](coll[i]);
                this.coll[plugin.name] = plugin;
                if (typeof plugin.keyBinding == "string") {
                    plugin.keyBinding = {
                        meta   : (plugin.keyBinding.indexOf('meta')  > -1),
                        control: (plugin.keyBinding.indexOf('ctrl')  > -1),
                        alt    : (plugin.keyBinding.indexOf('alt')   > -1),
                        shift  : (plugin.keyBinding.indexOf('shift') > -1),
                        key    : plugin.keyBinding.charAt(plugin.keyBinding.length - 1)
                    };
                }
            }
        }
    }
    
    /**
     * Check if an item is actually a plugin (more specific: an ENABLED plugin)
     * 
     * @param {String} name
     * @type Boolean
     */
    this.isPlugin = function(name) {
        return this.coll[name] ? true : false;
    };

    /**
     * API; Get a plugin object
     *
     * @param {String} name
     * @type Editor.Plugin
     */
    this.get = function(name) {
        return this.coll[name] || null;
    };

    /**
     * API; Get all plugins matching a specific plugin-type
     * 
     * @param {String} type
     * @type Array
     */
    this.getByType = function(type) {
        var res = [], item;
        for (var i in this.coll) {
            item = this.coll[i];
            if (item.type == type || item.subType == type)
                res.push(item);
        }
        return res;
    };

    /**
     * API; Get all plugins matching a specific Event hook
     * 
     * @param {String} hook
     * @type Array
     */
    this.getByHook = function(hook) {
        var res = [];
        for (var i in this.coll)
            if (this.coll[i].hook == hook)
                res.push(this.coll[i]);
        return res;
    };

    /**
     * Notify a plugin of any occuring Event, if it has subscribed to it
     *
     * @param {String} name
     * @param {String} hook
     * @type mixed
     */
    this.notify = function(name, hook) {
        var i, item;
        for (i in this.coll) {
            item = this.coll[i];
            if (item.name == name && item.hook == hook
              && !item.busy)
                return item.execute(this.editor, arguments);
        }
    };
    
    /**
     * Notify all plugins of an occuring Event
     *
     * @param {String} hook
     * @type Array
     */
    this.notifyAll = function(hook) {
        var res = [], item;
        for (var i in this.coll) {
            item = this.coll[i];
            if (item.hook == hook && !item.busy)
                res.push(item.execute(this.editor, arguments));
        }
        return res;
    };

    /**
     * Notify all plugins of an occuring keyboard Event with a certain key combo
     *
     * @param {Object} keyMap
     * @type Array
     */
    this.notifyKeyBindings = function(keyMap) {
        var res = false, item;
        for (var i in this.coll) {
            item = this.coll[i];
            if (item.keyBinding && !item.busy
              && (keyMap.meta    == item.keyBinding.meta)
              && ((keyMap.control == item.keyBinding.control)
                 || (jpf.isMac && keyMap.meta == item.keyBinding.control))
              && (keyMap.alt     == item.keyBinding.alt)
              && (keyMap.shift   == item.keyBinding.shift)
              && (keyMap.key     == item.keyBinding.key)) {
                item.execute(this.editor, arguments);
                res = true;
            }
        }
        return res;
    }
};

jpf.editor.TOOLBARITEM   = "toolbaritem";
jpf.editor.TOOLBARBUTTON = "toolbarbutton";
jpf.editor.TOOLBARPANEL  = "toolbarpanel";
jpf.editor.TEXTMACRO     = "textmacro";
jpf.editor.CMDMACRO      = "commandmacro";

/**
 * @class Plugin
 * @contructor
 * @extends editor
 * @namespace jpf
 * @author Mike de Boer <mike@javeline.com>
 *
 * Example plugin:
 * <code language=javascript>
 * jpf.editor.plugin('sample', function() {
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
jpf.editor.Plugin = function(sName, fExec) {
    jpf.editor.Plugin[sName] = fExec;
    fExec.prototype = {
        storeSelection : function() {
            if (this.editor)
                this.bookmark = this.editor.Selection.getBookmark('simple');
        },

        restoreSelection : function() {
            if (this.editor && jpf.isIE && this.bookmark)
                this.editor.Selection.moveToBookmark(this.bookmark);
        }
    };
};

// #endif
