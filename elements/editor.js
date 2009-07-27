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
 * <code>
 *     <a:editor
 *         id="myEditor"
 *         left="100"
 *         width="50%"
 *         height="90%-10">
 *         Default value...
 *     </a:editor>
 * </code>
 *
 * @constructor
 * @addnode elements:editor
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 *
 * @inherits apf.Validation
 * @inherits apf.XForms
 * @inherits apf.DataBinding
 * @inherits apf.Presentation
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * Example:
 * Sets the text based on data loaded into this component.
 * <code>
 *  <a:editor>
 *      <a:bindings>
 *          <a:value select="body/text()" />
 *      </a:bindings>
 *  </a:editor>
 * </code>
 * Example:
 * A shorter way to write this is:
 * <code>
 *  <a:colorpicker ref="body/text()" />
 * </code>
 */
apf.editor = apf.component(apf.NODE_VISIBLE, function() {
    var inited, complete;

    /**** Default Properties ****/

    var commandQueue = [];
    var _self        = this;

    this.value           = "";
    this.$value          = "";

    this.oDoc = this.oWin = null;

    /**** Properties and Attributes ****/

    this.isContentEditable = true;

    this.$supportedProperties.push("value");

    this.$propHandlers["value"] = function(html){
        if (!inited || !complete)
            return;

        if (typeof html != "string")// || html == ""
            html = "";//apf.isIE ? "<br />" :

        // If the HTML string is the same as the contents of the iframe document,
        // don't do anything...
        if (this.$value.replace(/\r/g, "") == html)
            return;
        
        this.$value = html;

        html = html.replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, 
            "<br _apf_marker='1' /><br _apf_marker='1' />");

        // #ifdef __PARSER_HTML
        html = apf.htmlParser.prepare(html);
        // #endif

        if (this.$pluginsActive == "code") {
            this.$plugins["code"].update(this, html);
        }
        else {
            this.oDoc.body.innerHTML = html;

            if (apf.isGecko) {
                var oNode, oParent = this.oDoc.body;
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
            else if (apf.isSafari) {
                this.oDoc.designMode = "on";
            }
            else if (apf.isIE) {
                // yes, we fix hyperlinks...%&$#*@*!
                var s, aLinks = this.oDoc.getElementsByTagName("a");
                for (var i = 0, j = aLinks.length; i < j; i++) {
                    s = aLinks[i].getAttribute("_apf_href");
                    if (s) { //prefix 'http://' if it's not there yet...
                        aLinks[i].href = (s.indexOf("http://") == -1 
                            ? "http://" : "") + s;
                    }
                }
            }
        }
            
        this.dispatchEvent("sethtml", {editor: this});

        //this.$visualFocus(true);
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
        if (apf.isIE) {
            setTimeout(function() {
                _self.oDoc.body.contentEditable = true;
            });
        }
        else {
            try {
                this.oDoc.designMode = "on";
                if (apf.isGecko) {
                    // Tell Gecko (Firefox 1.5+) to enable or not live resizing of objects
                    this.oDoc.execCommand("enableObjectResizing", false, this.imagehandles);
                    // Disable the standard table editing features of Firefox.
                    this.oDoc.execCommand("enableInlineTableEditing", false, this.tablehandles);
                }
            }
            catch (e) {};
        }
        if (justinited) {
            //this.$propHandlers["value"].call(this, "");
            this.dispatchEvent("complete", {editor: this});
            complete = true;
        }
    };

    /**
     * API; processes the current state of the editor's content and outputs the result that
     *      can be used inside any other content or stored elsewhere.
     *
     * @return The string of (X)HTML that is inside the editor.
     * @type {String}
     */
    this.getValue = function(bStrict) {
        return (this.$value = apf.htmlParser.parse(this.oDoc.body.innerHTML, bStrict));
    };

    /**
     * API; replace the (X)HTML that's inside the Editor with something else
     *
     * @param {String} html
     * @type  {void}
     */
    this.setHTML  =
    this.setValue = function(value){
        return this.setProperty("value", value);
    };

    /**
     * Invoked by the Databinding layer when a model is reset/ cleared.
     * 
     * @type {void}
     */
    this.$clear = function(nomsg) {
        if (!nomsg) {
            this.value = "";
            return this.$propHandlers["value"].call(this, "");
        }
    };

    /**
     * Issue a command to the editable area.
     *
     * @param {String} cmdName
     * @param {mixed}  cmdParam
     * @type  {void}
     */
    this.$execCommand = function(cmdName, cmdParam) {
        if (!this.$plugins[cmdName] && inited && complete
          && this.state != apf.DISABLED) {
            if (apf.isIE) {
                if (!this.oDoc.body.innerHTML)
                    return commandQueue.push([cmdName, cmdParam]);
                else
                    this.$selection.set();
            }

            this.$visualFocus();
            
            if (cmdName.toLowerCase() == "removeformat") {
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

            this.oDoc.execCommand(cmdName, false, cmdParam);

            // make sure that the command didn't leave any <P> tags behind (cleanup)
            cmdName    = cmdName.toLowerCase();
            var bNoSel = (cmdName == "SelectAll");
            if (apf.isIE) {
                if ((cmdName == "insertunorderedlist" || cmdName == "insertorderedlist")
                  && this.$queryCommand(cmdName) == apf.OFF) {
                    bNoSel = true;
                }
                else if (cmdName == "outdent") {
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
                    /* #ifndef __WITH_PARSER_HTML
                    this.oDoc.body.innerHTML = this.oDoc.body.innerHTML;
                    #else*/
                    this.oDoc.body.innerHTML = apf.htmlParser.prepare(
                        this.oDoc.body.innerHTML);
                    // #endif
                }
                var r = this.$selection.getRange();
                if (r)
                    r.scrollIntoView();
            }
            
            this.$notifyAllButtons();
            this.change(this.getValue());

            setTimeout(function() {
                //_self.$notifyAllButtons(); // @todo This causes pain, find out why
                if (apf.isIE && !bNoSel)
                   _self.$selection.set();
                _self.$visualFocus();
            });
        }
    };

    /**
     * Paste (clipboard) data into the Editor
     *
     * @see element.editor.method.inserthtml
     * @param {Event} e
     * @type  {void}
     * @private
     */
    function onPaste(e) {
        setTimeout(function() {
            var s = this.oDoc.body.innerHTML;
            if (s.match(/mso[a-zA-Z]+/i)) { //check for Paste from Word
                var o = _self.$plugins["pasteword"];
                if (o)
                    _self.$propHandlers["value"].call(_self, o.parse(s));
            }
            if (_self.realtime)
                _self.change(_self.getValue());
        });
    }

    var oBookmark;
    /**
     * Event handler; fired when the user clicked inside the editable area.
     *
     * @see object.abstractevent
     * @param {Event} e
     * @type void
     * @private
     */
    function onClick(e) {
        if (oBookmark && apf.isGecko) {
            var oNewBm = _self.$selection.getBookmark();
            if (typeof oNewBm.start == "undefined" && typeof oNewBm.end == "undefined") {
                //this.$selection.moveToBookmark(oBookmark);
                //RAAAAAAAAAAH stoopid firefox, work with me here!!
            }
        }

        var which = e.which, button = e.button;
        setTimeout(function() {
            var rClick = ((which == 3) || (button == 2));
            if (apf.window.focussed != this) {
                //this.$visualFocus(true);
                _self.focus({});
            }
            else if (!rClick)
                _self.$focus({});
        });

        apf.AbstractEvent.stop(e);
    }

    /**
     * Event handler; fired when the user right clicked inside the editable area
     *
     * @param {Event} e
     * @type  {void}
     * @private
     */
    function onContextmenu(e) {
        if (_self.state == apf.DISABLED) return;
        //if (apf.isIE)
        //    this.$visualFocus(true);
        var ret = _self.$notifyAllPlugins("context", e);
    }

    var changeTimer = null;
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

    /**
     * Event handler; fired when the user pressed a key inside the editor IFRAME.
     * For IE, we apply some necessary behavior correction and for other browsers, like
     * Firefox and Safari, we enable some of the missing default keyboard shortcuts.
     *
     * @param {Event} e
     * @type {Boolean}
     * @private
     */
    function onKeydown(e) {
        e = e || window.event;
        var i, found, code = e.which || e.keyCode;
        if (apf.isIE) {
            if (commandQueue.length > 0 && _self.oDoc.body.innerHTML.length > 0) {
                for (i = 0; i < commandQueue.length; i++)
                    _self.$execCommand(commandQueue[i][0], commandQueue[i][1]);
                commandQueue = [];
            }
            switch(code) {
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
                    apf.AbstractEvent.stop(e);
                    if (_self.realtime)
                        _self.change(_self.getValue());
                }
            }
            else if (!e.ctrlKey && !e.shiftKey && code == 13)
                _self.dispatchEvent("keyenter", {editor: _self, event: e});
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
            if (found) {
                apf.AbstractEvent.stop(e);
                return false;
            }
        }

        if (code == 9) { // tab
            if (listBehavior.call(_self, e)) {
                apf.AbstractEvent.stop(e);
                return false;
            }
        }
        else if (code == 8 || code == 46) //backspace or del
            listBehavior.call(_self, e, true); //correct lists, if any

        if (!e.ctrlKey && !e.altKey && (code < 112 || code > 122)
          && (code < 33  && code > 31 || code > 42 || code == 8 || code == 13)) {
            resumeChangeTimer();
        }

        apf.window.$keydown(e);
        //keydownTimer = null;
    }

    var keyupTimer = null;

    /**
     * Event handler; fired when the user releases a key inside the editable area
     *
     * @see object.abstractevent
     * @param {Event} e
     * @type  {void}
     * @private
     */
    function onKeyup(e) {
        _self.$selection.cache();
        if (keyupTimer != null)
            return;

        function keyupHandler() {
            clearTimeout(keyupTimer);
            if (_self.state == apf.DISABLED) return;
            _self.$notifyAllButtons();
            _self.dispatchEvent("typing", {editor: _self, event: e});
            _self.$notifyAllPlugins("typing", e.code);
            keyupTimer = null;
        }

        keyupTimer = window.setTimeout(keyupHandler, 200);
        //keyHandler();
        apf.window.$keyup(e || window.event);
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

    /**** Focus Handling ****/

    /**
     * Give or return the focus to the editable area, hence 'visual' focus.
     *
     * @param {Boolean} bNotify Flag set to TRUE if plugins should be notified of this event
     * @type  {void}
     */
    this.$visualFocus = function(bNotify) {
        // setting focus to the iframe content, upsets the 'code' plugin
        var bCode = (this.$pluginsActive == "code");
        if (apf.window.focussed == this && !bCode) {
            try {
                _self.oWin.focus();
            }
            catch(e) {};
        }

        if (bCode) {
            _self.$notifyAllButtons(apf.DISABLED);
            _self.$notifyButton("code", apf.SELECTED);
        }
        else if (bNotify)
            _self.$notifyAllButtons();
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

        this.setProperty("state", (this.$pluginsActive == "code")
            ? apf.DISABLED
            : apf.OFF);

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

        if (e && e.mouse && apf.isIE) {
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
        return apf.isChildOf(this.oDoc, e.srcElement, true);
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

        var pParent = apf.popup.last && apf.lookup(apf.popup.last);
        if (pParent && pParent.editor == this)
            apf.popup.forceHide();

        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);

        var bCode = (this.$pluginsActive == "code");
        if (!this.realtime || bCode)
            this.change(bCode ? this.$plugins["code"].getValue() : this.getValue());

        this.setProperty("state", apf.DISABLED);
    };

    /**
     * Add various event handlers to a <i>Editor</i> object.
     *
     * @type {void}
     */
    this.$addListeners = function() {
        apf.AbstractEvent.addListener(this.oDoc, "mouseup", onClick);
        //apf.AbstractEvent.addListener(this.oDoc, 'select', onClick.bindWithEvent(this));
        apf.AbstractEvent.addListener(this.oDoc, "keyup", onKeyup);
        apf.AbstractEvent.addListener(this.oDoc, "keydown", onKeydown);
        apf.AbstractEvent.addListener(this.oDoc, "mousedown", function(e){
            e = e || window.event;
            _self.$selection.cache();
            apf.popup.forceHide();
            //this.$notifyAllButtons();
            apf.window.$mousedown(e);
        });

        apf.AbstractEvent.addListener(this.oDoc, "contextmenu", onContextmenu);
        apf.AbstractEvent.addListener(this.oDoc, "focus", function(e) {
            //if (!apf.isIE)
                apf.window.$focus(_self); //TODO: ok?
        });
        apf.AbstractEvent.addListener(this.oDoc, "blur", function(e) {
            //if (!apf.isIE)
                apf.window.$blur(_self); //TODO: ok?
        });

        this.oDoc.host = this;

        apf.AbstractEvent.addListener(this.oDoc.body, "paste", onPaste);
    };

    //this.addEventListener("contextmenu", onContextmenu);

    /**** Button Handling ****/

    /**
     * Draw all the HTML elements at startup time.
     *
     * @type {void}
     */
    this.$draw = function() {
        this.$editable();

        //this.plugins   = new apf.editor.plugins(this.$plugins, this);
        var oEditor    = this.$getLayoutNode("main", "editor",  this.oExt);

        this.iframe = document.createElement("iframe");
        this.iframe.setAttribute("frameborder", "0");
        this.iframe.setAttribute("border", "0");
        this.iframe.setAttribute("marginwidth", "0");
        this.iframe.setAttribute("marginheight", "0");
        oEditor.appendChild(this.iframe);
        this.oWin = this.iframe.contentWindow;
        this.oDoc = this.oWin.document;

        this.$selection = new apf.selection(this.oWin, this.oDoc, this);

        // get the document style (CSS) from the skin:
        // see: apf.presentation.getCssString(), where the following statement
        // is derived from.
        var sCss = apf.queryValue($xmlns(apf.skins.skins[this.skinName.split(":")[0]].xml,
            "docstyle", apf.ns.aml)[0], "text()");
        if (!sCss) {
            sCss = "\
                html {\
                    cursor: text;\
                    border: 0;\
                }\
                body {\
                    margin: 8px;\
                    padding: 0;\
                    border: 0;\
                    color: #000;\
                    font-family: Verdana,Arial,Helvetica,sans-serif;\
                    font-size: 10pt;\
                    background: #fff;\
                    word-wrap: break-word;\
                }\
                .itemAnchor {\
                    background:url(images/editor/items.gif) no-repeat left bottom;\
                    line-height:6px;\
                    overflow:hidden;\
                    padding-left:12px;\
                    width:12px;\
                }\
                .visualAid table,\
                .visualAid table td {\
                    border: 1px dashed #bbb;\
                }\
                .visualAid table td {\
                    margin: 8px;\
                }\
                h1 {\
                    margin : 15px 0 15px 0;\
                }\
                p {\
                    margin: 0;\
                    padding: 0;\
                }\
                sub, sup {\
                    line-height: 10px;\
                }";
        }

        this.oDoc.open();
        this.oDoc.write('<?xml version="1.0" encoding="UTF-8"?>\
            <html>\
            <head>\
                <title></title>\
                <style type="text/css">' + sCss + '</style>\
            </head>\
            <body class="visualAid"></body>\
            </html>');
        this.oDoc.close();

        //#ifdef __WITH_WINDOW_FOCUS
        if (apf.hasFocusBug)
            apf.sanitizeTextbox(this.oDoc.body);
        //#endif

        //#ifdef __WITH_LAYOUT
        // setup layout rules:
        //@todo add this to $destroy
        apf.layout.setRules(this.oExt, this.uniqueId + "_editor",
            "var o = apf.all[" + this.uniqueId + "];\
            if (o) o.$resize()");
        apf.layout.activateRules(this.oExt);
        //#endif

        // do the magic, make the editor editable.
        this.makeEditable();

        setTimeout(function() {
            _self.setProperty("state", apf.DISABLED);
        })
    };

    /**
     * Takes care of setting the proper size of the editor after a resize event
     * was fired through the JPF layout manager
     * @see object.layout
     * 
     * @type {void}
     */
    this.$resize = function() {
        if (!this.iframe || !this.iframe.parentNode || !this.oExt.offsetHeight)
            return;
            
        var h = (this.oExt.offsetHeight - this.oToolbar.offsetHeight - 2);
        if (!h || h < 0)
            h = 0;

        this.iframe.parentNode.style.height = h + "px";

        //TODO: check if any buttons from the toolbar became invisible/ visible again...
        this.$notifyAllPlugins("resize");

        if (this.$pluginsActive == "code")
            this.$plugins["code"].setSize(this);
    };

    /**
     * Parse the block of AML that constructed this editor instance for arguments
     * like width, height, etc.
     *
     * @param {XMLRootElement} x
     * @type  {void}
     */
    this.$loadAml = function(x){
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);

        if (apf.isOnlyChild(x.firstChild, [3,4]))
            this.$handlePropSet("value", x.firstChild.nodeValue.trim());
        else
            apf.AmlParser.parseChildren(this.$aml, null, this);

        if (typeof this.realtime == "undefined")
            this.$propHandlers["realtime"].call(this);
        
        //apf.ed = this;
        //apf.ed.iframe.contentWindow.document == apf.ed.oDoc
    };

    this.$destroy = function() {
        //this.plugins.$destroy();
        this.$selection.$destroy();
        /*this.plugins = */this.$selection = this.oDoc.host = this.oToobar =
            this.oDoc = this.oWin = this.iframe = null;
    };
}).implement(
     //#ifdef __WITH_VALIDATION
    apf.Validation,
    //#endif
    //#ifdef __WITH_XFORMS
    apf.XForms,
    //#endif
    //#ifdef __WITH_DATABINDING
    apf.DataBinding,
    //#endif
    apf.Presentation,
    apf.ContentEditable
);

// #endif
