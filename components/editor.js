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
            fontColors           : ['000000','993300','333300','003300','003366','000080','333399',
                                    '333333','800000','FF6600','808000','808080','008080','0000FF',
                                    '666699','808080','FF0000','FF9900','99CC00','339966','33CCCC',
                                    '3366FF','800080','999999','FF00FF','FFCC00','FFFF00','00FF00',
                                    '00FFFF','00CCFF','993366','C0C0C0','FF99CC','FFCC99','FFFF99',
                                    'CCFFCC','CCFFFF','99CCFF','CC99FF','FFFFFF'],
            fontNames            : ['Arial','Comic Sans MS','Courier New','Tahoma','Times New Roman','Verdana'],
            value                : '',
            jsPath               : '',
            contentPath          : 'content/',
            theme                : 'default',
            pluginPath           : 'content/',
            smileyPath           : '',
            smileyImages         : [],
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
            this.Win.height = this.options.height;
	    this.Win.width  = this.options.width;
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
                        height:38px;\
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
     * Restore (server) font settings in editor
     * @type void
     */
    this._restoreFontSettings =  function() {
        if (!jpf.isOpera && !jpf.isSafari) {
            this.insertHTML('.');
            this.setHTML('');
            //if (this._toolbarinited)
            //    this.Toolbar.notifyAll();
        }
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
                    if (node.childNodes[j].nodeType == 3 || oNode.childNodes[j].nodeType == 4) {
                        buttons = parseCommaSep(node.childNodes[j].nodeValue);
                    }
                }
                if (buttons.length)
                    this.toolbars.push(
                        new jpf.editor.Toolbar(this.ToolbarNode,
                            buttons, this)
                    );
            }

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
                    this.Doc.execCommand('useCSS', false, !this.options.useSpanGecko);
                    this.Doc.execCommand('styleWithCSS', false, this.options.useSpanGecko);
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
        this._restoreFontSettings();
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
            if (jpf.isIE) {
                this.Doc.innerHTML = html;
                var oParent = this.Doc;
                while (oParent.hasChildNodes()) {
                    if (oParent.lastChild.nodeType == 1) {
                        if (oParent.lastChild.nodeName == "BR"
                            && oParent.lastChild.getAttribute('_ie_placeholder') == "TRUE") {
                            this.Selection.selectNode(oParent.lastChild);
                            this.Selection.Delete();
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
                html = html.replace(/<STRONG([ \>])/gi, '<b$1');
                html = html.replace(/<\/STRONG>/gi, '<\/b>');
                html = html.replace(/<EM([ \>])/gi, '<i$1');
                html = html.replace(/<\/EM>/gi, '<\/i>');
//                if (html.length == 0)
//                    this.Doc.body.innerHTML = '<br _moz_editor_bogus_node="TRUE" style="display:none;"> '; // Adding a space after the <br> unhides the cursor
//                else if (/^<(p|div)>\s*<\/\1>$/i.test(html))
//                    this.Doc.body.innerHTML = html.replace(/></, '><br _moz_editor_bogus_node="TRUE" style="display:none;"><');
//                else
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
            var oSel;
            if (jpf.isIE) {
                this.setFocus();
                oSel = document.selection;
                if (oSel.type.toLowerCase() != "none")
                    oSel.clear();
                oSel.createRange().pasteHTML(html);
            }
            else {
                // Delete the actual selection.
                oSel = this.Selection.Delete();
                // Get the first available range.
                var oRange = oSel.getRangeAt(0);
                // Create a fragment with the input HTML.
                var oFragment = oRange.createContextualFragment(html);
                // Get the last available node.
                var oLastNode = oFragment.lastChild;
                // Insert the fragment in the range.
                oRange.insertNode(oFragment);
                // Set the cursor after the inserted fragment.
                this.Selection.selectNode(oLastNode);
                this.Selection.collapse(false);
                this.setFocus();
            }
        }
    };
    
    /**
     * Grab all data from the Clipboard, maintained by the OS.
     * @type String
     */
    this.getClipboardData = function() {
        var sData = "", oDiv, oTextRange;
        oDiv = $('___HiddenDiv');
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
    
    /**
     * Issue a command to the editable area.
     * @param {String} cmdName
     * @param {mixed} cmdParam
     * @type void
     */
    this.executeCommand = function(cmdName, cmdParam) {
        if (!this.Plugins.isPlugin(cmdName) && this._inited && this._complete) {
            if (jpf.isIE) {
                if (empty(this.Doc.innerHTML.stripTags()))
                    return this.commandQueue.push([cmdName, cmdParam]);
                this.Selection.selectNode(this.Doc);
            }
            this.setFocus();
            this.Selection.getSelection().execCommand(cmdName, false, cmdParam);
            if (jpf.isIE)
                this.Selection.collapse(false);
        }
    };
    
    /**
     * Get the state of a command (on, off or disabled)
     * @param {String} cmdName
     * @type Number
     */
    this.getCommandState = function(cmdName) {
        try {
            if (!this.Selection.getSelection().queryCommandEnabled(cmdName))
                return jpf.editor.DISABLED;
            else
                return this.Selection.getSelection().queryCommandState(cmdName) ? jpf.editor.ON : jpf.editor.OFF ;
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
        var updateSmilies = ((options.smileyPath || options.smileyImages) &&
            (this.options.smileyPath != options.smileyPath || !this.options.smileyImages.equals(options.smileyImages)));

        jpf.extend(this.options, options);

        // Smiley panel redraw necessary
        if (updateSmilies)
            this.Plugins.get('Smilies').updatePanelBody = true;

        this.toolbarAction('update', this.options.forceRedraw);
    };

    this.hidePopup = function() {
        jpf.Popup.hide();
        var plugins = this.Plugins.getByType(jpf.editor.TOOLBARPANEL);
        for (var i = 0; i < plugins.length; i++) {
            plugins[i].state = jpf.editor.OFF;
            this.toolbarAction('notify', plugins[i].name, jpf.editor.OFF);
        }
    }

    this.showPopup = function(oPlugin, sCacheId, oRef) {
        jpf.Popup.show(sCacheId, 0, 24, false, oRef);
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
        if (e) Event.stop(e);
    };

    /**
     * Event handler; fired when the user clicked inside the editable area.
     * @param {Event} e
     * @type void
     */
    this.onClick = function(e) {
        this.hidePopup();
        if (e.rightClick)
            this.onContextmenu(e);
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
        var i;
        jpf.console.log('onKeydown fired...' + e.code);
        this.toolbarAction('notifyAll');
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
                        this.Selection.Delete() ;
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
                switch (e.code) {
                    case 66 :	// B
                    case 98 :	// b
                        this.executeCommand('bold');
                        break;
                    case 105 :	// i
                    case 73 :	// I
                        this.executeCommand('italic');
                        break;
                    case 117 :	// u
                    case 85 :	// U
                        this.executeCommand('underline');
                        break;
                    case 86 :	// V
                    case 118 :	// v
                        this.onPaste();
                        break ;
                }
            }
            else if (!e.control && !e.shift && e.code == 13) {
                this.dispatchEvent('onkeyenter', {editor: this, event: e});
            }
        }
    };
    
    /**
     * Event handler; fired when the user releases a key inside the editable area
     * @param {Event} e
     * @type void
     */
    this.onKeyup = function(e) {
        this.dispatchEvent('ontyping', {editor: this, event: e});
        this.Plugins.notifyAll('onTyping', e.code);
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
        var type = (arguments.length == 1) ? arguments[0] : "click";
        return {
            type  : type,
            _bogus: true
        };
    };

    /**
    * Add various event handlers to a <i>Editor</i> object.
    * @type void
    */
    this._attachBehaviors = function() {
        jpf.editor.cache[this.id] = this;

        jpf.AbstractEvent.addListener(this.Doc, 'contextmenu', this.onContextmenu.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.Doc, 'click', this.onClick.bindWithEvent(this));
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
     * @type Editor.Selection
     */
    this.editor = editor;

    /**
     * Get the selection of the editable area
     * @type Range
     */
    this.getSelection = function() {
        if (jpf.isIE)
            return document.selection.createRange();
        else
            return this.editor.Doc;
    };

    /**
     * Get the type of selection of the editable area
     * @type String
     */
    this.getType = function() {
        if (jpf.isIE) {
            return document.selection.type;
        }
        else {
            var type = "Text";
            var oSel;
            try {
                oSel = this.editor.Win.contentWindow.getSelection();
            }
            catch (e) {}
            if (oSel && oSel.rangeCount == 1) {
                var oRange = oSel.getRangeAt(0);
                if (oRange.startContainer == oRange.endContainer && (oRange.endOffset - oRange.startOffset) == 1)
                    type = "Control";
            }
            return type ;
        }
    };

    /**
     * Retrieve the currently selected element from the editable area
     * @type DOMObject
     */
    this.getSelectedElement = function() {
        if (this.getType() == "Control") {
            if (jpf.isIE) {
                var oRange = document.selection.createRange();
                if (oRange && oRange.item)
                    return document.selection.createRange().item(0);
            }
            else {
                var oSel = this.editor.Win.contentWindow.getSelection() ;
                return oSel.anchorNode.childNodes[oSel.anchorOffset];
            }
        }
        else
            return null;
    };

    /**
     * Retrieve the parent node of the currently selected element from the editable area
     * @type DOMObject
     */
    this.getParentElement = function() {
        switch (this.getType()) {
            case "Control" :
                if (jpf.isIE)
                    return this.getSelectedElement().parentElement;
                else
                    return this.getSelectedElement().parentNode;
            case "None" :
                return;
            default :
                if (jpf.isIE) {
                    return document.selection.createRange().parentElement();
                }
                else {
                    var oSel = this.editor.Win.contentWindow.getSelection();
                    if (oSel) {
                        var oNode = oSel.anchorNode;
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
     * @param {DOMObject} node
     * @type void
     */
    this.selectNode = function(node) {
        this.editor.setFocus();
        if (jpf.isIE) {
            document.selection.empty();
            var oRange = document.selection.createRange();
            oRange.moveToElementText(node);
            oRange.select();
        }
        else {
            var oRange = document.createRange();
            oRange.selectNode(node);
            var oSel = this.editor.Win.contentWindow.getSelection();
            oSel.removeAllRanges();
            oSel.addRange(oRange);
        }
    };
    
    /**
     * Collapse the selection to the end OR start
     * @param {Boolean} toStart
     * @type void
     */
    this.collapse = function(toStart) {
        this.editor.setFocus();
        if (jpf.isIE) {
            var oRange = document.selection.createRange() ;
            oRange.collapse(toStart == null || toStart === true);
            oRange.select();
        }
        else {
            var oSel = this.editor.Win.contentWindow.getSelection();
            if (toStart == null || toStart === true)
                oSel.collapseToStart() ;
            else
                oSel.collapseToEnd() ;
        }
    };

    /**
     * Check if the currently selected element has any parent node(s) with the specified tagname
     * @param {String} nodeTagName
     * @type Boolean
     */
    this.hasAncestorNode = function(nodeTagName) {
        var oContainer ;
        if (this.getType() == "Control" || !jpf.isIE) {
            oContainer = this.getSelectedElement();
            if (!oContainer && !jpf.isIE) {
                try {
                    oContainer = this.editor.Win.contentWindow.getSelection().getRangeAt(0).startContainer;
                }
                catch(e){}
            }
        }
        else {
            var oRange  = document.selection.createRange();
            oContainer = oRange.parentElement();
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
     * @param {String} nodeTagName
     * @type void
     */
    this.moveToAncestorNode = function(nodeTagName) {
        var oNode, i;
        if (jpf.isIE) {
            if (this.getType() == "Control") {
                var oRange = document.selection.createRange();
                for (i = 0; i < oRange.length; i++) {
                    if (oRange(i).parentNode) {
                        oNode = oRange(i).parentNode;
                        break;
                    }
                }
            }
            else {
                var oRange = document.selection.createRange();
                oNode = oRange.parentElement();
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
    this.Delete = function() {
        var oSel, i;
        if (jpf.isIE) {
            oSel = document.selection;
            if (oSel.type.toLowerCase() != "none")
                oSel.clear();
        }
        else {
            oSel = this.editor.Win.contentWindow.getSelection();
            if (oSel)
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
            }
        }
    }
    
    /**
     * Check if an item is actually a plugin (more specific: an ENABLED plugin)
     * @param {String} name
     * @type Boolean
     */
    this.isPlugin = function(name) {
        return Boolean(this.coll[name]);
    };

    /**
     * API; Get a plugin object
     * @param {String} name
     * @type Editor.Plugin
     */
    this.get = function(name) {
        return this.coll[name] || null;
    };

    /**
     * API; Get all plugins matching a specific plugin-type
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
        var state;
        var isPlugin = _self.editor.Plugins.isPlugin(this.id);
        if (isPlugin) {
            var plugin = _self.editor.Plugins.get(this.id);
            state = typeof plugin.queryState == "function"
                ? plugin.queryState(_self.editor)
                : _self.editor.editorState;
        }
        else {
            state = _self.editor.getCommandState(this.id);
        }
        if (state == jpf.editor.DISABLED) {
            this.disable();
            _self.editor.editorState = jpf.editor.DISABLED;
        }
        else {
            _self.editor.editorState = jpf.editor.ON;
            if (this.disabled) this.enable();
            if (!e._bogus) {
                if (isPlugin)
                    plugin.execute(_self.editor);
                else
                    _self.editor.executeCommand(this.id);
            }
            if (state == jpf.editor.ON) {
                addClass(this, 'editor_selected');
                this.selected = true;
            }
            else {
                removeClass(this, 'editor_selected');
                this.selected = false;
            }
        }
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
//                if (plugin.subType != jpf.editor.TOOLBARBUTTON && !isRedraw)
//                    plugin.execute(this.editor);
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
    this.notify = function(cmdName, state) {
        if (!this.items[cmdName]) return;
        
        if (state == jpf.editor.DISABLED) {
            this.items[cmdName].disable();
        }
        else {
            if (state == jpf.editor.HIDDEN)
                this.items[cmdName].style.display = "none";
            else if (state == jpf.editor.VISIBLE)
                this.items[cmdName].style.display = "";
            else {
                var oPlugin = this.editor.Plugins.get(cmdName);
                if (oPlugin && typeof oPlugin.queryState == "function")
                    state = oPlugin.queryState(this.editor);
                if (this.items[cmdName].style.display.indexOf('none') > -1)
                    this.items[cmdName].style.display = "";
                if (this.items[cmdName].disabled)
                    this.items[cmdName].enable();
                var btnState = (this.items[cmdName].selected) ? jpf.editor.ON : jpf.editor.OFF;
                if (state != btnState)
                    this.items[cmdName].onclick(this.editor.mimicEvent());
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
            state = this.editor.getCommandState(item);
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
