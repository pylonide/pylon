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
 */

jpf.editor = jpf.component(jpf.GUI_NODE, function() {
    /**
     * Initialize the Editor class.
     * @param {String} id
     * @param {DOMObject} container The container element in which this editor instance should appear.
     * @param {Object} options Optional.
     * @type Editor
     */
    this.init = function() {
        this.id             = 'editor_' + this.uniqueId;
        this.editorState    = jpf.editor.ON;
        this.commandQueue   = [];
        this.toolbars       = [];
        this._inited        = false;
        this._complete      = false;
        this._toolbarinited = false;
        this._isHidden      = false;
    };

    /**
     * Set the optional global settings for the Editor. If no options are provided,
     * the defaults are used.
     * @param {Object} options Generic object, containing all the custom options.
     * @type void
     */
    this.setOptions = function(options) {
        this.options = {
            //width                : '100%',
            height               : 50,
            buttons              : ['Bold', 'Italic', 'Underline', 'Smilies'],
            plugins              : ['Smilies', 'Contextualtyping'],
            fontNames            : ['Arial','Comic Sans MS','Courier New','Tahoma','Times New Roman','Verdana'],
            emotions             : [],
            emotionsPath         : 'skins/images/editor',
            value                : '',
            jsPath               : '',
            contentPath          : 'content/',
            theme                : 'default',
            pluginPath           : 'content/',
            classEditorArea      : 'editor_Area',
            classToolbar         : 'editor_Toolbar',
            useSpanGecko         : true,
            forceVScrollIE       : true,
            UseBROnCarriageReturn: true,
            imageHandles         : false,
            tableHandles         : false,
            maxTextLength        : 1200,
            returnType           : 'text' //can be 'text' or 'dom', if you want to retrieve an object.
        };
        jpf.extend(this.options, options || {});
    };
    
    function parseCommaSep(sArg) {
        if (!sArg) return null;
        var ret = sArg.trim().replace(/\n/g, '').split(',');
        for (var i = 0; i < ret.length; i++)
            ret[i] = ret[i].trim().toLowerCase();
        return ret.length ? ret : null;
    }

    /**
     * Draw all the HTML elements at startup time.
     * @type void
     */
    this.draw = function() {
        var x = this.jml;
        this.setOptions({
            //buttons      : parseCommaSep(x.getAttribute('buttons')),
            plugins      : parseCommaSep(x.getAttribute('plugins')),
            fontNames    : parseCommaSep(x.getAttribute('fontNames')),
            width        : parseInt(x.getAttribute('width'))  || null,
            height       : parseInt(x.getAttribute('height')) || null,
            opaqueButtons: jpf.isTrue(x.getAttribute('opaqueButtons')),
            buttonOpacity: parseFloat(x.getAttribute('buttonOpacity')) || null,
            value        : ''//this.oExt.innerHTML
        });
        
        this.oExt = this.__getExternal("main", null, function(oExt){
            oExt.setAttribute('id', this.id);
            if (typeof this.options.height == "number")
                this.options.height += "px";
            if (typeof this.options.width == "number")
                this.options.width += "px";

            oExt.setAttribute('style', 'overflow: visible; height: '
                + this.options.height + '; width: ' + this.options.width + ';');
        });
        
        //this.domNode.setAttribute('rico:widget', 'editor');
        this.oExt.editor = this;
        
        this.Plugins   = new jpf.editor.Plugins(this.options.plugins, this);
        this.Selection = new jpf.editor.Selection(this);

        //this.container.appendChild(this.domNode);

        this.ToolbarNode = document.createElement('div');
        this.ToolbarNode.setAttribute('id', this.id + '___Toolbar');
        this.ToolbarNode.className = this.options.classToolbar + "_Container";
        this.oExt.appendChild(this.ToolbarNode);
        
        if (!jpf.isIE) {
            this.Win = document.createElement('iframe');
            this.Win.setAttribute('frameborder', 'no');
            this.Win.setAttribute('id', this.id + '___EditorArea');
            //this.Win.height = this.options.height;
	    //this.Win.width  = this.options.width;
            //this.Win.src    = this.options.jsPath + "blank.html";
            this.oExt.appendChild(this.Win);
            this.Doc = this.Win.contentWindow.document;
            this.Doc.open();
            this.Doc.write('<?xml version="1.0" encoding="UTF-8"?>\
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">\
                <html>\
                <head>\
                    <title></title>\
                    <style type="text/css">\
                    body\
                    {\
                        margin: 0;\
                        padding: 0;\
                        border:2px solid #fff;\
                        color: Black;\
                        font-family: Verdana;\
                        font-size: 10pt;\
                        background:#fff;\
                    }\
                </style>\
                </head>\
                <body></body>\
                </html>');
            this.Doc.close();
        }
        else {
            this.Win = this.Doc = document.createElement('div');
            this.Doc.setAttribute('id', this.id + '___EditorArea');
            this.Doc.style.height = this.options.height;
	    this.Doc.style.width  = this.options.width;
            this.oExt.appendChild(this.Win);
        }
        this.Win.className = this.options.classEditorArea;
        this.linkedField = document.createElement('input');
        this.linkedField.type  = "hidden";
        this.linkedField.name  = this.id + "___Hidden";
        this.linkedField.value = this.options.value;
        this.oExt.appendChild(this.linkedField);

        this.drawToolbar();
    };

    /**
     * Draw all HTML elements for the Editor.Toolbar
     * @see Editor.Toolbar
     * @type void
     */
    this.drawToolbar = function() {
        if (!this._toolbarinited) {
            var oNode = this.__getOption('toolbars');
            for (var i = 0; i < oNode.childNodes.length; i++) {
                if (oNode.childNodes[i][jpf.TAGNAME] != "toolbar")
                    continue;
                var node = oNode.childNodes[i], buttons;
                for (var j = 0; j < node.childNodes.length; j++) {
                    if (node.childNodes[j].nodeType == 3 || node.childNodes[j].nodeType == 4) {
                        buttons = parseCommaSep(node.childNodes[j].nodeValue);
                    }
                }
                if (buttons.length)
                    this.toolbars.push(
                        new jpf.editor.Toolbar(this.ToolbarNode,
                            buttons, this)
                    );
            }
            
            var br = this.ToolbarNode.appendChild(document.createElement("br"));
            br.setAttribute("clear", "all");

            this._toolbarinited = true;
            // do the magic, make the editor editable.
            this.makeEditable();
        }
    };

    /**
     * Iterate over all the toolbar instances and fire an action on the object
     * 
     * @param {String} sAction The action to execute (i.e. 'notifyAll')
     * @param {mixed}  mArg1    Optional One argument to be passed
     * @param {mixed}  mArg2    Optional One argument to be passed
     * @type  {void}
     */
    this.toolbarAction = function(sAction, mArg1, mArg2) {
        if (!this.toolbars.length) return;
        for (var i = 0; i < this.toolbars.length; i++) {
            if (this.toolbars[i][sAction])
                this.toolbars[i][sAction](mArg1, mArg2)
        }
    }

    /**
     * Return the Identifier of this Editor instance
     * @type String
     */
    this.getId = function() {
        return this.id;
    };
    
    /**
     * Important function; tells the right <i>iframe</i> element that it may be edited by the user.
     * @type void
     */
    this.makeEditable = function() {
        var justinited = false;
        if (!this._inited) {
            this._attachBehaviors();
            this._inited = true;
            justinited   = true;
        }
        if (jpf.isIE) {
            this.Doc.contentEditable = true;
        }
        else {
            try {
                this.Doc.designMode = 'on';
                if (jpf.isGecko) {
                    // Tell Gecko to use or not the <SPAN> tag for the bold, italic and underline.
                    try {
                        this.Doc.execCommand('styleWithCSS', false, this.options.useSpanGecko);
                    }
                    catch (ex) {
                        this.Doc.execCommand('useCSS', false, !this.options.useSpanGecko);
                    }
                    // Tell Gecko (Firefox 1.5+) to enable or not live resizing of objects (by Alfonso Martinez)
                    this.Doc.execCommand('enableObjectResizing', false, this.options.imageHandles);
                    // Disable the standard table editing features of Firefox.
                    this.Doc.execCommand('enableInlineTableEditing', false, this.options.tableHandles);
                }
            }
            catch (e) {};
        }
        if (justinited) {
            this.setHTML('');
            this.dispatchEvent('oncomplete', {editor: this});
            this._complete = true;
        }
    };

    /**
     * Give or return the focus to the editable area.
     * @type void
     */
    this.setFocus = function() {
        if (!jpf.isIE) {
            try {
                this.Win.contentWindow.focus();
                //this.Doc.focus();
            }
            catch(e) {};
        }
        else {
            try {
                this.Doc.focus();
            }
            catch(e) {};
        }
    };

    /**
     * Give or return the focus to the editable area.
     * @type void
     */
    this.setBlur = function(e) {
        this.dispatchEvent('onblurhandle', {editor: this});
    };
    
    /**
     * API; set the width of the Editor from outside this class.
     * @param {Number} width New width in px or %
     * @type void
     */
    this.setWidth = function(width) {
        if (this._inited && this._complete) {
            if (width == 0 && !this._isHidden) {
                Element.hide(this.oExt);
                this._isHidden = true;
            }
            else if (width > 0) {
                if (this._isHidden) {
                    Element.show(this.oExt);
                    this._isHidden = false;
                }
                this.options.width = width;
                this.oExt.style.width = width + ((typeof width == "number") ? "px" : "");
                if (jpf.isIE)
                    this.Doc.style.width = width + ((typeof width == "number") ? "px" : "");
                else
                    this.Win.width = width + ((typeof width == "number") ? -10 + "px" : "");
                this.ToolbarNode.style.width = width + ((typeof width == "number") ? "px" : "");
                if (width == 0)
                    this._isHidden = true;
                else
                    this._isHidden = false;
            }
        }
    };

    /**
     * API; set the height of the Editor from outside this class.
     * @param {Number} height New height in px or %
     * @type void
     */
    this.setHeight = function(height) {
        var cssHeight;
        if (this._inited && this._complete) {
            if (height == 0 && !this._isHidden) {
                Element.hide(this.oExt);
                this._isHidden = true;
            }
            else if (height > 0 || typeof height == "String") {
                if (this._isHidden) {
                    Element.show(this.oExt);
                    this._isHidden = false;
                }
                this.options.height = height;
                cssHeight = height + ((typeof height == "Number") ? "px" : "");
                this.oExt.style.height = cssHeight;
                this.oExt.style.minHeight = cssHeight;
                if (height == 0)
                    this._isHidden = true;
                else
                    this._isHidden = false;
            }
        }
    };

    /**
     * API; get the (X)HTML that's inside the Editor at any given time
     * @param {String} returnType This may be left empty or set to 'dom' or 'text'
     * @see Editor.options
     * @type mixed
     */
    this.getXHTML = function(returnType) {
        if (!returnType) returnType = this.options.returnType;
        if (returnType == "text")
            return !jpf.isIE ? this.Doc.body.innerHTML : this.Doc.innerHTML;
        else
            return !jpf.isIE ? this.Doc.body : this.Doc;
    };

    /**
     * API; replace the (X)HTML that's inside the Editor with something else
     * @param {String} html
     * @type void
     */
    this.setHTML = function(html) {
        if (this._inited && this._complete) {
            if (typeof html == "undefined") html = "";
            html = this.parseHTML(html);
            if (jpf.isIE) {
                this.Doc.innerHTML = html;
                var oParent = this.Doc;
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
                this.Doc.innerHTML = html;
                this.Doc.designMode = "on";
            }
            else {
                this.Doc.body.innerHTML = html;
                // Tell Gecko to use or not the <SPAN> tag for the bold, italic and underline.
                this.Doc.execCommand('useCSS', false, !this.options.useSpanGecko);
            }
            this.toolbarAction('notifyAll');
            this.dispatchEvent('onsethtml', {editor: this});
            this.setFocus();
        }
    };
    
    /**
     * API; insert any given text (or HTML) at cursor position into the Editor
     * @param {String} html
     * @type void
     */
    this.insertHTML = function(html) {
        if (this._inited && this._complete) {
            this.setFocus();
            this.Selection.setContent(html);
        }
    };
    
    /**
     * Grab all data from the Clipboard, maintained by the OS.
     * @type String
     */
    this.getClipboardData = function() {
        var sData = "", oDiv, oTextRange;
        oDiv = document.getElementById('___HiddenDiv');
        if (!oDiv) {
            oDiv = document.createElement('div');
            oDiv.id = '___HiddenDiv';
            oDiv.style.visibility	= "hidden";
            oDiv.style.overflow		= "hidden";
            oDiv.style.position		= "absolute";
            oDiv.style.width		= 1;
            oDiv.style.height		= 1;
            document.body.appendChild(oDiv);
        }
        oDiv.innerHTML = "";
        oTextRange = document.selection.createRange();
        oTextRange.moveToElementText(oDiv);
        oTextRange.execCommand('Paste');
        sData = oDiv.innerHTML;
        oDiv.innerHTML = "";
        return sData;
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
        html = html.replace(/<a( )([^>]+)\/>|<a\/>/gi, '<a$1$2></a>'); // Force open

        return html;
    }
    
    /**
     * Issue a command to the editable area.
     * @param {String} cmdName
     * @param {mixed} cmdParam
     * @type void
     */
    this.executeCommand = function(cmdName, cmdParam) {
        if (!this.Plugins.isPlugin(cmdName) && this._inited && this._complete) {
            if (jpf.isIE) {
                if (!this.Doc.innerHTML)
                    return this.commandQueue.push([cmdName, cmdParam]);
                this.Selection.selectNode(this.Doc);
            }
            this.setFocus();
            this.Selection.getContext().execCommand(cmdName, false, cmdParam);
            if (jpf.isIE)
                this.Selection.collapse(false);
            jpf.console.log('executing command: ' + cmdName + ' with state ' + cmdParam + ', current: ' + this.getCommandState(cmdName))
            //this.toolbarAction('notify', cmdName);//, this.getCommandState(cmdName));
            this.toolbarAction('notifyAll');
        }
    };
    
    /**
     * Get the state of a command (on, off or disabled)
     * 
     * @param {String} cmdName
     * @type Number
     */
    this.getCommandState = function(cmdName) {
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

    /**
     * Update the Toolbar with a new/ updated set of Buttons.
     * @see Editor#Toolbar
     * @param {Event} e Probably a bogus one from @link Editor#fireEvent
     * @param {Object} options
     * @type void
     */
    this.onUpdateToolbar = function(e, options) {
        jpf.extend(this.options, options);

        this.toolbarAction('update', this.options.forceRedraw);
    };

    this.hidePopup = function() {
        jpf.Popup.hide();
        var plugins = this.Plugins.getByType(jpf.editor.TOOLBARPANEL);
        for (var i = 0; i < plugins.length; i++) {
            plugins[i].state = jpf.editor.OFF;
            //this.toolbarAction('notify', plugins[i].name, jpf.editor.OFF);
        }
    }

    this.showPopup = function(oPlugin, sCacheId, oRef, iWidth, iHeight) {
        jpf.Popup.show(sCacheId, 0, 24, false, oRef, iWidth, iHeight);
        oPlugin.state = jpf.editor.ON;
        this.toolbarAction('notify', oPlugin.name, jpf.editor.ON);
    }

    /**
     * Paste (clipboard) data into the Editor
     * @see Editor#insertHTML
     * @param {String} html Optional.
     * @type void
     */
    this.onPaste = function(e) {
        var sText = "";
        if (jpf.isIE)
            sText = encodeHTML(clipboardData.getData("Text"));
        sText = sText.replace(/\n/g, '<BR>');
        this.insertHTML(sText);
        if (e) e.stop();
    };

    /**
     * Event handler; fired when the user clicked inside the editable area.
     * @param {Event} e
     * @type void
     */
    this.onClick = function(e) {
        this.hidePopup();
        if (e.rightClick)
            return this.onContextmenu(e);
        this.toolbarAction('notifyAll');
        this.setFocus();
    };

    /**
     * Event handler; fired when the user double clicked inside the editable area
     * @param {Event} e
     * @type void
     */
    this.onDoubleclick = function(e) {
        this.hidePopup();
        this.toolbarAction('notifyAll');
        this.setFocus();
    };

    /**
     * Event handler; fired when the user right clicked inside the editable area
     * @param {Event} e
     * @type void
     */
    this.onContextmenu = function(e) {
        this.dispatchEvent('onrightclick', {editor: this});
        this.setFocus();
    };
    
    /**
     * Event handler; fired when the user presses a key inside the editable area
     * @param {Event} e
     * @type void
     */
    this.onKeydown = function(e) {
        var i, found;
        if (jpf.isIE) {
            if (this.commandQueue.length > 0 && this.Doc.innerHTML.stripTags().length > 0) {
                for (i = 0; i < this.commandQueue.length; i++)
                    this.executeCommand(this.commandQueue[i][0], this.commandQueue[i][1]);
                this.commandQueue = [];
            }
            switch(e.code) {
                case 13: //Enter
                    if (!(e.control || e.alt || e.shift)) {
                        /*
                        this.insertHTML('<br>&nbsp;');
                        oRange = document.selection.createRange();
                        oRange.moveStart('character', -1);
                        oRange.select();
                        oRange.parentElement().parentNode.removeChild(oRange.parentElement());
                        this.insertHTML('<br>&nbsp;');
                        oRange = document.selection.createRange();
                        oRange.moveStart('character', -1);
                        oRange.select();
                        document.selection.clear();
                        */
                        this.dispatchEvent('onkeyenter', {editor: this});
                        return false;
                    }
                    break;
                case 8: //Backspace
                    if (this.Selection.getType() == 'Control') {
                        this.Selection.remove() ;
                        return false ;
                    }
                    break;
                case 9: //Tab
                    break;
            }
        }
        else {
            this.setFocus();
            if (e.control && !e.shift && !e.alt) {
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
                        this.onPaste();
                        //found = true;
                        break ;
                }
                if (found)
                    e.stop();
            }
            else if (!e.control && !e.shift && e.code == 13) {
                this.dispatchEvent('onkeyenter', {editor: this, event: e});
            }
        }
        found = this.Plugins.notifyKeyBindings(e);
        if (found) {
            jpf.console.log('stopping an event');
            e.stop();
        }
    };

    var keyupTimer = null;
    /**
     * Event handler; fired when the user releases a key inside the editable area
     * @param {Event} e
     * @type void
     */
    this.onKeyup = function(e) {
        if (keyupTimer != null) return true;

        var _self = this;
        keyupTimer = window.setTimeout(function() {
            clearTimeout(keyupTimer);
            _self.toolbarAction('notifyAll');
            _self.dispatchEvent('ontyping', {editor: _self, event: e});
            _self.Plugins.notifyAll('onTyping', e.code);
            keyupTimer = null;
        }, 100);
        
        return true;
    };

    this.__blur = function(){
        this.hidePopup();
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
    }
    
    /**
     * Mimic an Event, to avoid errors under exceptional circumstances.
     * @type Object
     */
    this.mimicEvent = function() {
        var e = {
            type  : 'click',
            _bogus: true
        };
        if (arguments.length) {
            if (typeof arguments[0] == 'string')
                e.type = arguments[0];
            else
                jpf.extend(e, arguments[0]);
        }
        return e;
    };

    /**
    * Add various event handlers to a <i>Editor</i> object.
    * @type void
    */
    this._attachBehaviors = function() {
        jpf.editor.cache[this.id] = this;

        jpf.AbstractEvent.addListener(this.Doc, 'contextmenu', this.onContextmenu.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.Doc, 'click', this.onClick.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.Doc, 'select', this.onClick.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.Doc, 'keyup', this.onKeyup.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.Doc, 'keydown', this.onKeydown.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.Doc, 'focus', this.setFocus.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.Doc, 'blur', this.setBlur.bindWithEvent(this));

        jpf.AbstractEvent.addListener(this.Doc, 'paste', this.onPaste.bindWithEvent(this));
    };

    /**
     * Parse the block of JML that constructed this editor instance for arguments
     * like width, height, etc.
     * 
     * @param {XMLRootElement} x
     * @type {void}
     */
    this.__loadJML = function(x){
        var oInt = this.__getLayoutNode("Main", "container", this.oExt);
        
        this.oInt = this.oInt
        ? jpf.JMLParser.replaceNode(oInt, this.oInt)
        : jpf.JMLParser.parseChildren(x, oInt, this);
            
        jpf.JMLParser.parseChildren(this.jml, null, this);
        
        // parse smiley images, or 'emotions'
        var i, oNode = this.__getOption('emotions');
        for (i = 0; i < oNode.childNodes.length; i++) {
            if (oNode.childNodes[i].nodeType == 3 || oNode.childNodes[i].nodeType == 4) {
                this.options.emotions = parseCommaSep(oNode.childNodes[i].nodeValue);
            }
        }
        
        // parse fonts
        this.options.fontNames = {};
        oNode = this.__getOption('fonts');
        for (i = 0; i < oNode.childNodes.length; i++) {
            if (oNode.childNodes[i].nodeType == 3 || oNode.childNodes[i].nodeType == 4) {
                var font, fonts = oNode.childNodes[i].nodeValue.trim().replace(/\n/g, '').split(';');
                for (var j = 0; j < fonts.length; j++) {
                    font = fonts[j].trim().split('=');
                    this.options.fontNames[font[0].trim()] = font[1].trim();
                }
            }
        }
        
        // parse font sizes
        oNode = this.__getOption('fontsizes');
        for (i = 0; i < oNode.childNodes.length; i++) {
            if (oNode.childNodes[i].nodeType == 3 || oNode.childNodes[i].nodeType == 4) {
                this.options.fontSizes = parseCommaSep(oNode.childNodes[i].nodeValue);
            }
        }
        
        // parse any custom events formatted like 'onfoo="doBar();"'
        var attr = x.attributes;
        for (var i = 0; i < attr.length; i++) {
            if (attr[i].nodeName.substr(0,2) == "on")
                this.addEventListener(attr[i].nodeName,
                    new Function(attr[i].nodeValue));
        }
    }
}).implement(jpf.Presentation);

jpf.editor.ON             = 1;
jpf.editor.OFF            = 0;
jpf.editor.DISABLED       = -1;
jpf.editor.VISIBLE        = 2;
jpf.editor.HIDDEN         = 3;

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
            return this.editor.Doc;
    }

    /**
     * Get the selection of the editable area
     * 
     * @type Range
     */
    this.getSelection = function() {
        return document.selection 
            ? document.selection
            : this.editor.Win.contentWindow.getSelection()
    };
    
    this.getRange = function() {
        var sel = this.getSelection(), range;

        try {
            if (sel)
                range = sel.rangeCount > 0
                    ? sel.getRangeAt(0)
                    : (sel.createRange
                        ? sel.createRange()
                        : this.editor.Doc.createRange());
        }
        // IE throws unspecified error here if we're placed in a frame/iframe
        catch (ex) {}

        // No range found then create an empty one
        // This can occur when the editor is placed in a hidden container element on Gecko
        // Or on IE when there was an exception
        if (!range)
            range = jpf.isIE
                ? document.body.createTextRange()
                : this.editor.Doc.createRange();

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
    
    this.getContent = function() {
        var range = this.getRange(), sel = this.getSelection(), prefix, suffix, n;
        var oNode = jpf.isIE ? document.body : this.editor.Doc.body;

        prefix = suffix = '';

        if (this.editor.options.returnType == 'text')
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
        var oDoc = jpf.isIE ? document : this.editor.Doc;

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
                return this.editor.Doc;

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
            var oContainer = this.GetSelectedElement() ;
            if (!oContainer)
                oContainer = this.editor.Win.contentWindow
                .getSelection().getRangeAt(0).startContainer
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
        return Boolean(this.coll[name]);
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
        var res = [];
        for (var i in this.coll)
            if (this.coll[i].type == type || this.coll[i].subType == type)
                res.push(this.coll[i]);
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
        for (var i in this.coll)
            if (this.coll[i].name == name && this.coll[i].hook == hook
              && !this.coll[i].busy)
                return this.coll[i].execute(this.editor, arguments);
    };
    
    /**
     * Notify all plugins of an occuring Event
     *
     * @param {String} hook
     * @type Array
     */
    this.notifyAll = function(hook) {
        var res = [];
        for (var i in this.coll)
            if (this.coll[i].hook == hook && !this.coll[i].busy)
                res.push(this.coll[i].execute(this.editor, arguments));
        return res;
    };

    /**
     * Notify all plugins of an occuring keyboard Event with a certain key combo
     *
     * @param {Object} keyMap
     * @type Array
     */
    this.notifyKeyBindings = function(keyMap) {
        var res = false;
        for (var i in this.coll) {
            if (this.coll[i].keyBinding && !this.coll[i].busy
              && (keyMap.meta    == this.coll[i].keyBinding.meta)
              && (keyMap.control == this.coll[i].keyBinding.control)
              && (keyMap.alt     == this.coll[i].keyBinding.alt)
              && (keyMap.shift   == this.coll[i].keyBinding.shift)
              && (keyMap.key     == this.coll[i].keyBinding.key)) {
                this.coll[i].execute(this.editor, arguments);
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
    /*/return function() {
        this.name    = "PluginName";
        this.type    = "PluginType";
        this.subType = "PluginSubType";
        this.hook    = "EventHook";
        this.params  = null;
        this.execute = function() {
            alert(this.name);
        };
        this.register.apply(this);
    };*/
};

/**
 * @class Editor.Toolbar
 * @contructor
 * @extends Editor
 * @author Mike de Boer <mike@javeline.com>
 */
jpf.editor.Toolbar = function(container, buttons, editor) {
    /**
     * Initialize the Editor.Toolbar class.
     * @param {DOMObject} container The container element in which the Toolbar should appear.
     * @param {Editor} editor
     * @type Editor.Toolbar
     */
    this.container = container;
    this.editor    = editor;
    this.items     = {};

    var _self      = this;

    function hasClass(el, className){
        return el.className.indexOf(className) > -1;
    }

    function addClass(el, className){
        if (!hasClass(el, className))
            el.className = (el.className + ' ' + className).trim();
        return el;
    }

    function removeClass(el, className){
        el.className = el.className.replace(
            new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1'
        ).trim();
        return el;
    }
    
    function buttonEnable() {
        removeClass(this, 'editor_disabled');
        addClass(this, 'editor_enabled');
        this.disabled = false;
    }

    function buttonDisable() {
        removeClass(this, 'editor_enabled');
        addClass(this, 'editor_disabled');
        this.disabled = true;
    }

    function buttonClickHandler(e) {
        if (!e) e = window.event;
        //context 'this' is the buttons' DIV domNode reference
        if (!e._bogus) {
            e.isPlugin = _self.editor.Plugins.isPlugin(this.id);
            e.state    = getState(this.id, e.isPlugin);
        }
        if (e.state == jpf.editor.DISABLED) {
            this.disable();
            _self.editor.editorState = jpf.editor.DISABLED;
        }
        else {
            _self.editor.editorState = jpf.editor.ON;
            if (this.disabled) this.enable();
            if (!e._bogus) {
                if (e.isPlugin) {
                    _self.editor.Plugins.get(this.id).execute(_self.editor);
                } else
                    _self.editor.executeCommand(this.id);
                e.state = getState(this.id, e.isPlugin);
            }
            if (e.state == jpf.editor.ON) {
                addClass(this, 'editor_selected');
                this.selected = true;
            }
            else {
                removeClass(this, 'editor_selected');
                this.selected = false;
            }
        }
    }
    
    function getState(id, isPlugin) {
        if (typeof isPlugin == "undefined")
            isPlugin = false;
        var state = _self.editor.editorState;
        
        if (isPlugin) {
            var plugin = _self.editor.Plugins.get(id);
            if (typeof plugin.queryState == "function")
                state = plugin.queryState(_self.editor)
        }
        else
            state = _self.editor.getCommandState(id);
        return state;
    }

    /**
     * Add a toolbar item to the toolbar (includes parsing toolbar plugins)
     * @param {String} item
     * @type void
     */
    this.addItem = function(item, isRedraw) {
        if (item == "|") { //seperator!
            var oSep = this.domNode.appendChild(document.createElement('span'));
            oSep.className = "editor_seperator";
        }
        else {
            var isPlugin = this.editor.Plugins.isPlugin(item);
            if (isPlugin) {
                var plugin = this.editor.Plugins.get(item);
                if (plugin.type != jpf.editor.TOOLBARITEM) return;
            }

            var oLabel = document.createElement('span');
            if (isPlugin)
                oLabel.className = 'editor_icon editor_' + plugin.icon;
            else
                oLabel.className = 'editor_icon editor_' + item;

            var oButton = this.domNode.appendChild(document.createElement('a'));
            oButton.id        = item;
            oButton.href      = "javascript:;";
            oButton.title     = item;
            oButton.className = "editor_enabled";
            oButton.onclick   = buttonClickHandler;
            oButton.enable    = buttonEnable;
            oButton.disable   = buttonDisable;
            oButton.disabled  = false;
            oButton.selected  = false;
            oButton.appendChild(oLabel);

            this.items[item] = oButton;
            if (isPlugin) {
                plugin.buttonNode = oButton;
                if (plugin.subType == jpf.editor.TOOLBARPANEL && typeof plugin.init == "function")
                    plugin.init(this.editor);
            }
        }
    };
    
    /**
     * Draw all the HTML elements of the Toolbar at startup time.
     * @type void
     */
    this._draw = function(isRedraw) {
        if (typeof isRedraw == "undefined") isRedraw = false;

        this.domNode = document.createElement('div');
        this.domNode.className = this.editor.options.classToolbar;//'editor_Toolbar';
        //this.domNode.style.styleFloat = this.domNode.style.cssFloat = "left";

        var oStart = this.domNode.appendChild(document.createElement('span'));
        oStart.className = 'TB_Start';

        this.container.appendChild(this.domNode);
        for (var i = 0; i < buttons.length; i++)
            this.addItem(buttons[i], isRedraw);
    };
    
    this._draw();

    /**
     * Hide Toolbar buttons that are not specified by the parent (Editor) or show them if they are.
     * @type void
     */
    this.update = function(force) {
        if (typeof force == "undefined") force = false;
        var i, iLength = 0;
        for (i in this.items) iLength++;
        if ((this.editor.options.buttons.length != iLength) | force) {
            for (i in this.items)
                this.items[i].remove();
            this.items = {};
            this.domNode.parentNode.removeChild(this.domNode);
            this._draw(true);
        }
    };

    /**
     * Notify a specific button item on state changes (on, off, disabled, visible or hidden)
     * @param {String} cmdName
     * @param {String} state
     * @type void
     */
    this.notify = function(item, state) {
        if (!this.items[item]) return;
        
        if (typeof state == "undefined")
            state = this.editor.getCommandState(item);
        
        if (state == jpf.editor.DISABLED) {
            this.items[item].disable();
        }
        else {
            if (state == jpf.editor.HIDDEN)
                this.items[item].style.display = "none";
            else if (state == jpf.editor.VISIBLE)
                this.items[item].style.display = "";
            else {
                var oPlugin = this.editor.Plugins.get(item);
                if (oPlugin && typeof oPlugin.queryState == "function")
                    state = oPlugin.queryState(this.editor);
                if (this.items[item].style.display.indexOf('none') > -1)
                    this.items[item].style.display = "";
                if (this.items[item].disabled)
                    this.items[item].enable();
                var btnState = (this.items[item].selected) ? jpf.editor.ON : jpf.editor.OFF;
                if (state != btnState) {
                    this.items[item].onclick(this.editor.mimicEvent({
                        state   : state,
                        isPlugin: Boolean(oPlugin)
                    }));
                }
            }
        }
    };

    /**
     * Notify all button items on state changes (on, off or disabled)
     * @type void
     */
    this.notifyAll = function() {
        var item, state;
        for (item in this.items) {
            this.notify(item, state);
        }
    };
};

/**
 * @clas Editor.Panel
 * @contructor
 * @extends Editor
 * @author Mike de Boer <mike@javeline.com>
 */
//Editor.Panel = Class.create();
//USE jpf.Popup() from now on!

jpf.editor.cache = {};
// #endif
