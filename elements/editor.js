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

// #ifdef __JEDITOR || __INC_ALL
/**
 * Element displaying a Rich Text Editor, like M$ Office Word in a browser window. Even
 * though this Editor does not offer the same amount of features as Word, we did try to
 * make it behave that way, simply because it is considered to be the market leader among
 * word-processors.
 * Example:
 *
 * <code language=jml>
 *     <j:editor
 *         id="myEditor"
 *         left="100"
 *         width="50%"
 *         height="90%-10">
 *         Default value...
 *     </j:editor>
 * </code>
 *
 * @constructor
 * @addnode elements:editor
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

    this.state           = jpf.editor.ON;
    this.$buttons        = ['Bold', 'Italic', 'Underline'];
    this.$plugins        = ['tablewizard'];
    this.$nativeCommands = ['bold', 'italic', 'underline', 'strikethrough',
                            'justifyleft', 'justifycenter', 'justifyright',
                            'justifyfull', 'removeformat', 'cut', 'copy',
                            'paste', 'outdent', 'indent', 'undo', 'redo'];
    this.$classToolbar   = 'editor_Toolbar';

    /**** Properties and Attributes ****/

    //this.forceVScrollIE       = true;
    //this.UseBROnCarriageReturn= true;
    this.imagehandles      = false;
    this.tablehandles      = false;
    this.isContentEditable = true;
    this.useIframe         = false;
    this.output            = 'text'; //can be 'text' or 'dom', if you want to retrieve an object.

    this.$supportedProperties.push("value", "imagehandles", "tablehandles",
        "output", "state");

    this.$propHandlers["value"] = function(html){
        if (!inited || !complete)
            return;

        if (typeof html == "undefined")
            html = "";

        html = this.parseHTML(html);

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
        else if (jpf.isSafari)
            this.oDoc.designMode = "on";

        this.dispatchEvent('sethtml', {editor: this});

        this.$visualFocus(true);
    };

    this.$propHandlers["imagehandles"] = function(value){

    };

    this.$propHandlers["tablehandles"] = function(value){

    };

    this.$propHandlers["output"] = function(value){
        //@todo Update XML
    };

    this.$propHandlers["state"] = function(value){
        var bChanged = (this.state != value);
        this.state = value;
        if (bChanged) // if state has changed, update the button look/ feel
            this.notifyAll(value);
    };
    this.$propHandlers["plugins"] = function(value){
        this.$plugins = value && value.splitSafe(value) || null;
    };

    /**
     * Important function; tells the right <i>iframe</i> element that it may be
     * edited by the user.
     *
     * @type void
     */
    this.makeEditable = function() {
        var justinited = false;
        if (!inited) {
            this.$addListeners();
            inited = justinited = true;
        }
        if (jpf.isIE) {
            this.oDoc.body.contentEditable = true;
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
            this.dispatchEvent('complete', {editor: this});
            complete = true;
        }
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
     *
     * @param {String} output This may be left empty or set to 'dom' or 'text'
     * @type  {mixed}
     */
    this.getXHTML = function(output) {
        if (!output) output = this.output;
        if (output == "text")
            return this.oDoc.body.innerHTML;
        else
            return this.oDoc.body;
    };

    /**
     * API; processes the current state of the editor's content and outputs the result that
     *      can be used inside any other content or stored elsewhere.
     *
     * @return The string of (X)HTML that is inside the editor.
     * @type {String}
     */
    this.getValue = function() {
        return this.parseHTML(this.getXHTML('text'))//.replace(/<br\/?>/gi, '<br/>')
            .replace(/<DIV[^>]*_jpf_placeholder="1">(.*)<\/DIV>/gi, '$1<br/>')
            .replace(/<br\/><\/li>/gi, '</li>')
            .replace(/<BR[^>]*_jpf_placeholder="1"\/?>/gi, '');

    };

    /**
     * API; replace the (X)HTML that's inside the Editor with something else
     *
     * @param {String} html
     * @type  {void}
     */
    this.setHTML = function(html) {
        this.$propHandlers['value'].call(this, html);
    };

    /**
     * API; insert any given text (or HTML) at cursor position into the Editor
     *
     * @param {String} html
     * @type  {void}
     */
    this.insertHTML = function(html) {
        if (inited && complete) {
            this.$visualFocus(true);
            this.Selection.setContent(this.parseHTML(html));
        }
    };

    /**
     * Processes, sanitizes and cleanses a string of raw html that originates
     * from a contentEditable area.
     *
     * @param  {String} html
     * @return The sanitized string, valid to store and use in external content
     * @type   {String}
     */
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
     *
     * @param {String} cmdName
     * @param {mixed}  cmdParam
     * @type  {void}
     */
    this.executeCommand = function(cmdName, cmdParam) {
        if (!this.Plugins.isPlugin(cmdName) && inited && complete) {
            if (jpf.isIE && !this.oDoc.body.innerHTML)
                return commandQueue.push([cmdName, cmdParam]);

            this.$visualFocus();
            this.oDoc.execCommand(cmdName, false, cmdParam);
            if (jpf.isIE) {
                //this.Selection.collapse(true);
                // make sure that the command didn't leave any <P> tags behind...cleanup
                if ((cmdName == "InsertUnorderedList" || cmdName == "InsertOrderedList")
                  && this.getCommandState(cmdName) == jpf.editor.OFF) {
                    this.oDoc.body.innerHTML = this.parseHTML(this.oDoc.body.innerHTML);
                }
                this.$visualFocus();
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
            if (!this.oDoc.queryCommandEnabled(cmdName))
                return jpf.editor.DISABLED;
            else
                return this.oDoc.queryCommandState(cmdName)
                    ? jpf.editor.ON
                    : jpf.editor.OFF ;
        }
        catch (e) {
            return jpf.editor.OFF;
        }
    };

    /**
     * Make an instance of jpf.popup (identified with a pointer to the cached
     * DOM node - sCacheId) visible to the user.
     *
     * @param {jpf.editor.Plugin} oPlugin  The plugin instance
     * @param {String}            sCacheId Pointer to the cached DOM node
     * @param {DOMElement}        oRef     Button node to show popup below to
     * @param {Number}            iWidth   New width of the popup
     * @param {Number}            iHeight  New height of the popup
     * @type  {void}
     */
    this.showPopup = function(oPlugin, sCacheId, oRef, iWidth, iHeight) {
        if (jpf.popup.last && jpf.popup.last != sCacheId) {
            var o = jpf.lookup(jpf.popup.last);
            if (o) {
                o.state = jpf.editor.OFF;
                this.notify(o.name, o.state);
            }
        }

        jpf.popup.show(sCacheId, {
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
                    if (key == 13 && typeof oPlugin['submit'] == "function") //Enter
                        oPlugin.submit(new jpf.AbstractEvent(e));
                }
            },
            draggable: true
        });
        oPlugin.state = jpf.editor.ON;
        this.notify(oPlugin.name, jpf.editor.ON);
    };

    /**
     * Paste (clipboard) data into the Editor
     *
     * @see Editor#insertHTML
     * @param {Event} e
     * @type  {void}
     * @private
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

    var oBookmark;
    /**
     * Event handler; fired when the user clicked inside the editable area.
     *
     * @see jpf.AbstractEvent
     * @param {Event} e
     * @type void
     * @private
     */
    function onClick(e) {
        if (oBookmark && jpf.isGecko) {
            var oNewBm = this.Selection.getBookmark();
            //window.console.dir(this.Selection.getRange());
            if (typeof oNewBm.start == "undefined" && typeof oNewBm.end == "undefined") {
                //this.Selection.moveToBookmark(oBookmark);
                //RAAAAAAAAAAH stoopid firefox, work with me here!!
            }
        }

        if (jpf.window.focussed != this) {
            //this.$visualFocus(true);
            this.focus(e);
        }
        else if (!e.rightClick)
            this.$focus(e);

        e.stop();
    }

    /**
     * Event handler; fired when the user right clicked inside the editable area
     *
     * @param {Event} e
     * @type  {void}
     * @private
     */
    function onContextmenu(e) {
        //jpf.console.log('onContextMenu fired.');
        if (jpf.isIE)
            this.$visualFocus(true);
        jpf.console.dir(this.Selection.getSelectedNode());
        this.Plugins.notifyAll('oncontext', e);
    }

    var keydownTimer = null;

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
        keydownTimer = window.setTimeout(function(e) {
            clearTimeout(keydownTimer);
            keydownTimer = null;
        }, 200);
        var i, found;
        if (jpf.isIE) {
            if (commandQueue.length > 0 && _self.oDoc.body.innerHTML.length > 0) {
                for (i = 0; i < commandQueue.length; i++)
                    _self.executeCommand(commandQueue[i][0], commandQueue[i][1]);
                commandQueue = [];
            }
            switch(e.code) {
                case 13: // enter
                    if (!(e.control || e.alt || e.shift)) {
                        // replace paragraphs with divs
                        var pLists = _self.Plugins.get('bullist', 'numlist');
                        if (pLists.length) {
                            if (pLists[0].queryState(_self) == jpf.editor.ON
                              || pLists[1].queryState(_self) == jpf.editor.ON)
                               return; //allow default behavior
                        }
                        var oNode = _self.Selection.moveToAncestorNode('div'), found = false;
                        if (oNode && oNode.getAttribute('_jpf_placeholder')) {
                            found = true;
                            var oDiv = _self.oDoc.createElement('div');
                            oDiv.setAttribute('_jpf_placeholder', '1');
                            oDiv.style.display    = "block";
                            oDiv.style.visibility = "hidden";
                            oDiv.innerHTML        = jpf.editor.ALTP.text;
                            if (oNode.nextSibling)
                                oNode.parentNode.insertBefore(oDiv, oNode.nextSibling);
                            else
                                oNode.parentNode.appendChild(oDiv);
                        }
                        else
                            _self.insertHTML(jpf.editor.ALTP.start + jpf.editor.ALTP.text + jpf.editor.ALTP.end);
                        var _select = jpf.appsettings.allowSelect;
                        jpf.appsettings.allowSelect = true;
                        _self.Selection.collapse(true);
                        var range = _self.Selection.getRange();
                        range.findText(jpf.editor.ALTP.text, found ? 1 : -1, 0);
                        range.select();
                        _self.Selection.remove();
                        jpf.appsettings.allowSelect = _select;

                        e.stop();
                        _self.dispatchEvent('keyenter', {editor: _self});
                        return false;
                    }
                    break;
                case 8: // backspace
                    found = false;
                    if (_self.Selection.getType() == 'Control') {
                        _self.Selection.remove();
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
            if ((e.control || (jpf.isMac && e.meta)) && !e.shift && !e.alt) {
                found = false;
                switch (e.code) {
                    case 66: // B
                    case 98: // b
                        _self.executeCommand('Bold');
                        found = true;
                        break;
                    case 105: // i
                    case 73: // I
                        _self.executeCommand('Italic');
                        found = true;
                        break;
                    case 117: // u
                    case 85: // U
                        _self.executeCommand('Underline');
                        found = true;
                        break;
                    case 86: // V
                    case 118: // v
                        if (!jpf.isGecko)
                            onPaste.call(_self);
                        //found = true;
                        break;
                    case 37:
                    case 39:
                        found = true;
                }
                if (found)
                    e.stop();
            }
            else if (!e.control && !e.shift && e.code == 13)
                _self.dispatchEvent('keyenter', {editor: _self, event: e});
        }
        _self.$visualFocus();
        if (e.meta || e.control || e.alt || e.shift) {
            found = _self.Plugins.notifyKeyBindings(e);
            if (found) {
                e.stop();
                return false;
            }
        }

        if (e.code == 9) {
            if (listBehavior.call(_self, e)) {
                e.stop();
                return false;
            }
        }
        else if (e.code == 8 || e.code == 46) //backspace or del
            listBehavior.call(_self, e, true); //correct lists, if any

        document.onkeydown(e);
        keydownTimer = null;
    }

    /**
     * Event handler; fired when the user presses a key inside the editable area
     *
     * @see jpf.AbstractEvent
     * @param {Event} e
     * @type  {void}
     * @private
     */
    function onKeydown(e) {
        if (keydownTimer === null)
            return keydownHandler(e);

        return true;
    }

    var keyupTimer = null;

    /**
     * Event handler; fired when the user releases a key inside the editable area
     *
     * @see jpf.AbstractEvent
     * @param {Event} e
     * @type  {void}
     * @private
     */
    function onKeyup(e) {
        if (keyupTimer != null)
            return true;

        function keyupHandler() {
            clearTimeout(keyupTimer);
            _self.notifyAll();
            _self.dispatchEvent('typing', {editor: _self, event: e});
            _self.Plugins.notifyAll('onTyping', e.code);
            keyupTimer = null;
        }

        keyupTimer = window.setTimeout(keyupHandler, 100);
        //keyHandler();
        document.onkeyup(e);
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
        var pLists = this.Plugins.get('bullist', 'numlist');
        if (!pLists || !pLists.length) return false;
        if (typeof e.shift != "undefined")
           e.shiftKey = e.shift;
        var pList = pLists[0].queryState(this) == jpf.editor.ON
            ? pLists[0]
            : pLists[1].queryState(this) == jpf.editor.ON
                ? pLists[1]
                : null;
        if (!pList) return false;
        if (bFix === true)
            pList.correctLists(this);
        else
            pList.correctIndentation(this, e.shiftKey ? 'outdent' : 'indent');

        return true;
    }

    /**** Focus Handling ****/

    /**
     * Give or return the focus to the editable area, hence 'visual' focus.
     *
     * @param {Boolean} bNotify Flag set to TRUE if plugins should be notified of this event
     * @type  {void}
     */
    this.$visualFocus = function(bNotify) {
        if (jpf.window.focussed == this) {
            try {
                _self.oWin.focus();
            }
            catch(e) {};
        }

        if (bNotify)
            _self.notifyAll();
    };

    var fTimer;
    /**
     * Fix for focus handling to mix 'n match nicely with other JPF elements
     *
     * @param {Event} e
     * @type  {void}
     */
    this.$focus = function(e){
        if (!this.oExt || this.oExt.disabled)
            return;

        this.$setStyleClass(this.oExt, this.baseCSSname + "Focus");

        function delay(){
            try {
                if (!fTimer || document.activeElement != _self.oExt) {
                    _self.$visualFocus(true);
                    clearInterval(fTimer);
                }
                else {
                    clearInterval(fTimer);
                    return;
                }
            }
            catch(e) {}
        }

        if (e && e.mouse && jpf.isIE) {
            clearInterval(fTimer);
            fTimer = setInterval(delay, 1);
        }
        else
            delay();
    };

    /**
     * Probe whether we should apply a focus correction to the editor at any
     * given interval
     *
     * @param {Event} e
     * @type  {Boolean}
     */
    this.$isContentEditable = function(e){
        return jpf.xmldb.isChildOf(this.oDoc, e.srcElement, true);
    };

    /**
     * Fix for focus/ blur handling to mix 'n match nicely with other JPF
     * elements
     *
     * @param {Event} e
     * @type  {void}
     */
    this.$blur = function(e){
        if (!this.oExt)
            return;

        var pParent = jpf.popup.last && jpf.lookup(jpf.popup.last);
        if (pParent && pParent.editor == this)
            jpf.popup.forceHide();

        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);

        /*if (jpf.hasMsRangeObject) {
            var r = this.oInt.createTextRange();
            r.collapse();
            r.select();
        }*/

        try {
            //if (jpf.isIE || !e || e.srcElement != jpf.window)
                //this.oWin.blur();
        }
        catch(e) {}
    };

    /**
    * Add various event handlers to a <i>Editor</i> object.
    *
    * @type {void}
    * @todo some day, in a far far constellation of this script, this part
    *       will be a remote colony, supplying all frames of the right parties
    */
    this.$addListeners = function() {
        jpf.AbstractEvent.addListener(this.oDoc, 'mouseup', onClick.bindWithEvent(this));
        //jpf.AbstractEvent.addListener(this.oDoc, 'select', onClick.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.oDoc, 'keyup', onKeyup.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.oDoc, 'keydown', onKeydown.bindWithEvent(this));
        jpf.AbstractEvent.addListener(this.oDoc, 'mousedown', (function(e){
            jpf.popup.forceHide();
            this.notifyAll();
            document.onmousedown(e.event);
        }).bindWithEvent(this));

        jpf.AbstractEvent.addListener(this.oDoc, 'contextmenu', function(e) {
            var pos = jpf.getAbsolutePosition(_self.iframe),
                ev  = new jpf.Event("contextmenu", {
                    clientX      : e.clientX + pos[0],
                    clientY      : e.clientY + pos[1],
                    withinIframe : true,
                    htmlEvent    : e.event
                });

            document.oncontextmenu(ev);

            if (ev.returnValue === false) {
                e.preventDefault();
                window.focus();
            }
        });
        jpf.AbstractEvent.addListener(this.oDoc, 'focus', function(e) {
            //if (!jpf.isIE)
                window.onfocus(e.event);
        });
        jpf.AbstractEvent.addListener(this.oDoc, 'blur', function(e) {
            //if (!jpf.isIE)
                window.onblur(e.event);
        });

        this.oDoc.host = this;

        jpf.AbstractEvent.addListener(this.oDoc, 'paste', onPaste.bindWithEvent(this));
    };

    this.addEventListener("contextmenu", onContextmenu);

    /**** Button Handling ****/

    /**
     * Transform the state of a button node to 'enabled'
     *
     * @type {void}
     * @private
     */
    function buttonEnable() {
        jpf.setStyleClass(this, 'editor_enabled',
            ['editor_selected', 'editor_disabled']);
        this.disabled = false;
    }

    /**
     * Transform the state of a button node to 'disabled'
     *
     * @type {void}
     * @private
     */
    function buttonDisable() {
        jpf.setStyleClass(this, 'editor_disabled',
            ['editor_selected', 'editor_enabled']);
        this.disabled = true;
    }

    /**
     * Handler function; invoked when a toolbar button node was clicked
     *
     * @see jpf.AbstractEvent
     * @param {Event}      e
     * @param {DOMElement} oButton
     * @type  {void}
     */
    this.$buttonClick = function(e, oButton) {
        var item = oButton.getAttribute("type");

        //context 'this' is the buttons' DIV domNode reference
        if (!e._bogus) {
            e.isPlugin = _self.Plugins.isPlugin(item);
            e.state    = getState(item, e.isPlugin);
        }

        if (e.state == jpf.editor.DISABLED) {
            buttonDisable.call(oButton);
        }
        else {
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
            var plugin = _self.Plugins.get(id);
            if (_self.state == jpf.editor.DISABLED && !plugin.noDisable)
                return jpf.editor.DISABLED;
            return plugin.queryState
                ? plugin.queryState(_self)
                : _self.state;
        }

        if (_self.state == jpf.editor.DISABLED)
            return jpf.editor.DISABLED;

        return _self.getCommandState(id);
    }

    /**
     * Notify a specific button item on state changes (on, off, disabled, visible or hidden)
     *
     * @param {String} item
     * @param {Number} state Optional.
     * @type  {void}
     */
    this.notify = function(item, state) {
        var oButton = oButtons[item];
        if (!oButton)
            return;

        var oPlugin = this.Plugins.get(item);
        if (typeof state == "undefined") {
            if (oPlugin && oPlugin.queryState)
                state = oPlugin.queryState(this);
            else
                state = this.getCommandState(item);
        }

        if (oButton.state === state)
            return;

        oButton.state = state;

        if (state == jpf.editor.DISABLED)
            buttonDisable.call(oButton);
        else if (state == jpf.editor.HIDDEN)
            oButton.style.display = "none";
        else if (state == jpf.editor.VISIBLE)
            oButton.style.display = "";
        else {
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
     *
     * @param {Number} state Optional.
     * @type  {void}
     */
    this.notifyAll = function(state) {
        for (var item in oButtons) {
            this.notify(item, state);
        }
    };

    /**** Init ****/

    /**
     * Draw all HTML elements for the editor toolbar
     *
     * @param {HTMLElement} oParent
     * @type  {void}
     * @private
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

                        oButton.setAttribute("onmousedown",
                            "jpf.findHost(this).$buttonClick(event, this);");
                        oButton.setAttribute("title", item);
                    }

                    oButton.setAttribute("onmouseover", "var o=jpf.findHost(this);\
                        o.$setStyleClass(this, 'hover');");
                    oButton.setAttribute("onmouseout", "var o=jpf.findHost(this);\
                        o.$setStyleClass(this, '', ['hover']);");

                    oButton.setAttribute("type", item);
                }
            }

            buttons = null;
        }
    };

    /**
     * Draw all the HTML elements at startup time.
     *
     * @type {void}
     */
    this.$draw = function() {
        if (this.$jml.getAttribute("plugins")) {
            this.$propHandlers["plugins"]
                .call(this, this.$jml.getAttribute("plugins"));
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
        var btns = this.oToolbar.getElementsByTagName("div");
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

        this.iframe = document.createElement('iframe');
        this.iframe.setAttribute('frameborder', '0');
        this.iframe.setAttribute('border', '0');
        this.iframe.setAttribute('marginwidth', '0');
        this.iframe.setAttribute('marginheight', '0');
        //this.iframe.className = oEditor.className;
        //oEditor.parentNode.replaceChild(this.iframe, oEditor);
        oEditor.appendChild(this.iframe);
        this.iframe.style.border = "none";
        this.oWin = this.iframe.contentWindow;
        this.oDoc = this.oWin.document;
        this.oDoc.open();
        this.oDoc.write('<?xml version="1.0" encoding="UTF-8"?>\
            <html>\
            <head>\
                <title></title>\
                <style type="text/css">\
                html{\
                    cursor : text;\
                    border: 0;\
                }\
                body\
                {\
                    margin: 0;\
                    padding: 0;\
                    border: none;\
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
                .visualAid table,\
                .visualAid table td\
                {\
                    border: 1px dashed #bbb;\
                }\
                .visualAid table td\
                {\
                    margin: 8px;\
                }\
                </style>\
            </head>\
            <body class="visualAid"></body>\
            </html>');
        this.oDoc.close();

        //#ifdef __WITH_WINDOW_FOCUS
        if (jpf.hasFocusBug) {
            jpf.sanitizeTextbox(this.oDoc.body);
        }
        //#endif

        // do the magic, make the editor editable.
        this.makeEditable();
    };

    /**
     * Parse the block of JML that constructed this editor instance for arguments
     * like width, height, etc.
     *
     * @param {XMLRootElement} x
     * @type  {void}
     */
    this.$loadJml = function(x){
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);

        if (jpf.xmldb.isOnlyChild(x.firstChild, [3,4]))
            this.$handlePropSet("value", x.firstChild.nodeValue.trim());
        else
            jpf.JmlParser.parseChildren(this.$jml, null, this);

        this.oExt.style.paddingTop    = this.oToolbar.offsetHeight + 'px';
        this.oToolbar.style.marginTop = (-1 * this.oToolbar.offsetHeight) + 'px';

        //this.useIframe = !jpf.isIE || jpf.isTrue(this.$getOption("main").getAttribute("iframe"));
        //jpf.console.log('use iframe? ', this.useIframe);
    };

    this.$destroy = function() {
        this.Plugins.destroyAll();
        this.Plugins = this.Selection = this.oDoc.host = null;
        this.oToobar = this.oDoc = this.oWin = this.iframe = null;
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
    start: '<div style="display:block;visibility:hidden;" _jpf_placeholder="1">',
    end  : '</div>',
    text : '{jpf_placeholder}'
};

// #endif
