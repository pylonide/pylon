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

// #ifdef __AMLEDITOR || __INC_ALL
/**
 * Element displaying a Rich Text Editor, like M$ Office Word in a browser
 * window. Even though this Editor does not offer the same amount of features
 * as Word, we did try to make it behave that way, simply because it is
 * considered to be the market leader among word-processors.
 * Example:
 * <code>
 *  <a:editor
 *    id     = "myEditor"
 *    left   = "100"
 *    width  = "50%"
 *    height = "90%-10">
 *    Default value...
 *  </a:editor>
 * </code>
 *
 * @constructor
 * @addnode elements:editor
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 *
 * @inherits apf.XForms
 * @inherits apf.StandardBinding
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * Example:
 * Sets the text based on data loaded into this component.
 * <code>
 *  <a:model id="mdlEditor">
 *      <data>
 *          <body>Some text</body>
 *      </data>
 *  </a:model>
 *  <a:editor 
 *    width  = "600" 
 *    height = "300" 
 *    model  = "mdlEditor" 
 *    value  = "[body/text()]" />
 * </code>
 */
apf.editor = function(struct, tagName){
    this.$init(tagName || "editor", apf.NODE_VISIBLE, struct);
};

(function() {
    this.implement(
        apf.ContentEditable
        //#ifdef __WITH_XFORMS
        //,apf.XForms
        //#endif
    );
    
    this.value  = "";
    this.$value = "";

    this.$oWin      =
    this.$oBookmark =
    this.$fTimer    = null;

    /**** Properties and Attributes ****/

    this.isContentEditable = true;

    this.$supportedProperties.push("value", "characterset");

    this.$propHandlers["value"] = function(html){
        if (typeof html != "string")// || html == ""
            html = "";//apf.isIE ? "<br />" :

        // If the HTML string is the same as the contents of the iframe document,
        // don't do anything...
        if (this.$value.replace(/\r/g, "") == html)
            return;
        
        this.$value = html;

        // #ifdef __WITH_HTML_CLEANER
        html = html.replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, 
            "<br _apf_marker='1' /><br _apf_marker='1' />");

        html = apf.htmlCleaner.prepare(html);
        // #endif

        if (this.$pluginsActive == "code") {
            this.$plugins["code"].update(this, html);
        }
        else {
            this.$activeDocument.body.innerHTML = html;
            this.$controlAgentBehavior(this.$activeDocument.body);
        }
            
        this.dispatchEvent("sethtml", {editor: this});
    };

    /**
     * Important function; tells the right <i>iframe</i> element that it may be
     * edited by the user.
     *
     * @type void
     */
    this.makeEditable = function() {
        var _self = this;
        
        if (apf.isIE) {
            $setTimeout(function() {
                _self.$activeDocument.body.contentEditable = true;
            });
        }
        else {
            try {
                this.$activeDocument.designMode = "on";
                if (apf.isGecko) {
                    // Tell Gecko (Firefox 1.5+) to enable or not live resizing of objects
                    this.$activeDocument.execCommand("enableObjectResizing",
                        false, this.imagehandles);
                    // Disable the standard table editing features of Firefox.
                    this.$activeDocument.execCommand("enableInlineTableEditing",
                        false, this.tablehandles);
                }
            }
            catch (e) {}
        }
        
        //this.$propHandlers["value"].call(this, "");
        this.dispatchEvent("complete", {editor: this});
    };

    //#ifdef __WITH_CONVENIENCE_API

    /**
     * processes the current state of the editor's content and outputs the result that
     *      can be used inside any other content or stored elsewhere.
     *
     * @return The string of (X)HTML that is inside the editor.
     * @type {String}
     */
    this.getValue = function(bStrict) {
        return (this.$value = apf.htmlCleaner.parse(
            this.$activeDocument.body.innerHTML, bStrict));
    };

    /**
     * replace the (X)HTML that's inside the Editor with something else
     *
     * @param {String} html
     * @type  {void}
     */
    this.setValue = function(value){
        return this.setProperty("value", value, false, true);
    };
    
    //#endif

    /**
     * Invoked by the Databinding layer when a model is reset/ cleared.
     * 
     * @type {void}
     */
    this.addEventListener("$clear", function(e) {
        if (!e.nomsg) {
            this.value = "";
            return this.$propHandlers["value"].call(this, "");
        }
    });

    /**
     * Paste (clipboard) data into the Editor
     *
     * @see element.editor.method.inserthtml
     * @param {Event} e
     * @type  {void}
     * @private
     */
    function onPaste(e) {
        var _self = this;
        $setTimeout(function() {
            var s = this.$activeDocument.body.innerHTML;
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
     * Event handler; fired when the user clicked inside the editable area.
     *
     * @see object.abstractevent
     * @param {Event} e
     * @type void
     * @private
     */
    function onClick(e) {
        if (this.$oBookmark && apf.isGecko) {
            var oNewBm = _self.$selection.getBookmark();
            if (typeof oNewBm.start == "undefined" && typeof oNewBm.end == "undefined") {
                //this.$selection.moveToBookmark(this.$oBookmark);
                //RAAAAAAAAAAH stoopid firefox, work with me here!!
            }
        }

        var which  = e.which,
            button = e.button,
            _self  = this;
        $setTimeout(function() {
            var rClick = ((which == 3) || (button == 2));
            //#ifdef __WITH_FOCUS
            if (apf.document.activeElement != this) {
                //this.$visualFocus(true);
                _self.focus({});
            }

            else/* #endif */
                if (!rClick)
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
        if (this.state == apf.DISABLED) return;
        //if (apf.isIE)
        //    this.$visualFocus(true);
        this.$notifyAllPlugins("context", e);
    }

    /**** Focus Handling ****/

    /**
     * Fix for focus handling to mix 'n match nicely with other JPF elements
     *
     * @param {Event} e
     * @type  {void}
     */
    this.$focus = function(e){
        if (!this.$ext || this.$ext.disabled)
            return;

        this.setProperty("state", (this.$pluginsActive == "code")
            ? apf.DISABLED
            : apf.OFF);

        this.$setStyleClass(this.$ext, this.$baseCSSname + "Focus");

        var _self = this;

        function delay(){
            try {
                if (!_self.$fTimer || document.activeElement != _self.$ext) {
                    _self.$visualFocus(true);
                    clearInterval(_self.$fTimer);
                }
                else {
                    clearInterval(_self.$fTimer);
                    return;
                }
            }
            catch(e) {}
        }

        if (e && e.mouse && apf.isIE) {
            clearInterval(this.$fTimer);
            this.$fTimer = setInterval(delay, 1);
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
        return apf.isChildOf(this.$activeDocument, e.srcElement, true);
    };

    /**
     * Fix for focus/ blur handling to mix 'n match nicely with other JPF
     * elements
     *
     * @param {Event} e
     * @type  {void}
     */
    this.$blur = function(e){
        if (!this.$ext)
            return;

        var pParent = apf.popup.last && apf.lookup(apf.popup.last);
        if (pParent && pParent.editor == this)
            apf.popup.forceHide();

        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Focus"]);

        var bCode = (this.$pluginsActive == "code");
        if (!this.realtime || bCode) {
            this.change(bCode
                ? this.$plugins["code"].getValue()
                : this.getValue());
        }

        this.setProperty("state", apf.DISABLED);
    };

    /**
     * Add various event handlers to a <i>Editor</i> object.
     *
     * @type {void}
     */
    this.$addListeners = function() {
        var _self = this;
        apf.AbstractEvent.addListener(this.$activeDocument, "mouseup", onClick.bindWithEvent(this, false));
        //apf.AbstractEvent.addListener(this.$activeDocument, 'select', onClick.bindWithEvent(this));
        apf.AbstractEvent.addListener(this.$activeDocument, "keyup", apf.window.$keyup);
        apf.AbstractEvent.addListener(this.$activeDocument, "keydown", apf.window.$keydown);
        apf.AbstractEvent.addListener(this.$activeDocument, "mousedown", function(e){
            e = e || window.event;
            _self.$selection.cache();
            //#ifdef __WITH_POPUP
            apf.popup.forceHide();
            //#endif
            apf.window.$mousedown(e);
        });

        apf.AbstractEvent.addListener(this.$activeDocument, "contextmenu", onContextmenu.bindWithEvent(this, false));
        //#ifdef __WITH_WINDOW_FOCUS
        apf.AbstractEvent.addListener(this.$activeDocument, "focus", apf.window.$focusevent);
        apf.AbstractEvent.addListener(this.$activeDocument, "blur", apf.window.$blurevent);
        //#endif
        this.$activeDocument.host = this;

        apf.AbstractEvent.addListener(this.$activeDocument.body, "paste", onPaste.bindWithEvent(this, false));
    };

    //this.addEventListener("contextmenu", onContextmenu);

    /**** Button Handling ****/

    /**
     * Draw all the HTML elements at startup time.
     *
     * @type {void}
     */
    this.$draw = function() {
        this.$editable(function() {
            //this.plugins   = new apf.editor.plugins(this.$plugins, this);
            var oEditor = this.$getLayoutNode("main", "editor",  this.$ext),
                _self   = this;

            this.iframe = document.createElement("iframe");
            this.iframe.setAttribute("frameborder", "0");
            this.iframe.setAttribute("border", "0");
            this.iframe.setAttribute("marginwidth", "0");
            this.iframe.setAttribute("marginheight", "0");
            oEditor.appendChild(this.iframe);
            this.$oWin = this.iframe.contentWindow;
            this.$activeDocument = this.$oWin.document;

            this.$selection = new apf.selection(this.$oWin,
                this.$activeDocument, this);

            // get the document style (CSS) from the skin:
            // see: apf.presentation.getCssString(), where the following statement
            // is derived from.
            var sCss = apf.queryValue($xmlns(apf.skins.skins[
                this.skinName.split(":")[0]].xml, "docstyle", apf.ns.aml)[0],
                "text()");
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
            var c = this.getAttribute("characterset")
                || this.getAttribute("charset") || apf.characterSet;
            this.$activeDocument.open();
            this.$activeDocument.write('<?xml version="1.0" encoding="' + c + '"?>\
                <html>\
                <head>\
                    <meta http-equiv="Content-Type" content="text/html; charset=' + c + '" />\
                    <title></title>\
                    <style type="text/css">' + sCss + '</style>\
                </head>\
                <body class="visualAid"></body>\
                </html>');
            this.$activeDocument.close();

            //#ifdef __WITH_WINDOW_FOCUS
            if (apf.hasFocusBug)
                apf.sanitizeTextbox(this.$activeDocument.body);
            //#endif

            //#ifdef __WITH_LAYOUT
            // setup layout rules:
            //@todo add this to $destroy
            apf.layout.setRules(this.$ext, this.$uniqueId + "_editor",
                "var o = apf.all[" + this.$uniqueId + "];\
                if (o) o.$resize()");
            apf.layout.queue(this.$ext);
            //#endif

            this.$addListeners();

            // do the magic, make the editor editable.
            this.makeEditable();

            $setTimeout(function() {
                _self.setProperty("state", apf.DISABLED);
            });
        });
    };

    /**
     * Takes care of setting the proper size of the editor after a resize event
     * was fired through the JPF layout manager
     * @see object.layout
     * 
     * @type {void}
     */
    this.$resize = function() {
        if (!this.iframe || !this.iframe.parentNode || !this.$ext.offsetHeight)
            return;
            
        var h = (this.$ext.offsetHeight - this.oToolbar.offsetHeight - 2);
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
    this.addEventListener("DOMNodeInsertedIntoDocument", function(){
        this.$int = this.$getLayoutNode("main", "container", this.$ext);

        if (apf.isOnlyChild(this.firstChild, [3,4]))
            this.$handlePropSet("value", this.firstChild.nodeValue.trim());

        //if (typeof this.realtime == "undefined")
            //this.$propHandlers["realtime"].call(this);
    });

    this.$destroy = function() {
        this.$selection.$destroy();
        this.$selection = this.$activeDocument.host = this.oToobar =
            this.$activeDocument = this.$oWin = this.iframe = null;
    };
// #ifdef __WITH_DATABINDING
}).call(apf.editor.prototype = new apf.StandardBinding());
/* #else
}).call(apf.editor.prototype = new apf.Presentation());
#endif */

apf.aml.setElement("editor", apf.editor);
// #endif
