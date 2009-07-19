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
 *  <j:editor>
 *      <j:bindings>
 *          <j:value select="body/text()" />
 *      </j:bindings>
 *  </j:editor>
 * </code>
 * Example:
 * A shorter way to write this is:
 * <code>
 *  <j:colorpicker ref="body/text()" />
 * </code>
 */
apf.editor = apf.component(apf.NODE_VISIBLE, function() {
    var inited, complete, oButtons = {};

    /**** Default Properties ****/

    var commandQueue = [];
    var _self        = this;

    this.value           = "";
    this.$value          = "";
    this.state           = apf.editor.ON;
    this.$buttons        = ['Bold', 'Italic', 'Underline'];
    this.$plugins        = ['pasteword', 'tablewizard'];
    this.$nativeCommands = ['bold', 'italic', 'underline', 'strikethrough',
                            'justifyleft', 'justifycenter', 'justifyright',
                            'justifyfull', 'removeformat', 'cut', 'copy',
                            'paste', 'outdent', 'indent', 'undo', 'redo'];
    this.$classToolbar   = 'editor_Toolbar';
    this.language        = 'en_GB';//'nl_NL';

    this.oDoc = this.oWin = null;

    /**** Properties and Attributes ****/

    this.isContentEditable = true;
    this.output            = 'text'; //can be 'text' or 'dom', if you want to retrieve an object.

    this.$booleanProperties["realtime"]     = true;
    this.$booleanProperties["imagehandles"] = true;
    this.$booleanProperties["tablehandles"] = true;
    this.$supportedProperties.push("value", "realtime", "imagehandles", 
        "tablehandles", "plugins", "output", "state", "language");

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

        html = this.prepareHtml(html);

        if (this.plugins.isActive('code')) {
            this.plugins.get('code').update(this, html);
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
                            this.selection.selectNode(oNode);
                            this.selection.remove();
                            this.selection.collapse(false);
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
            
        this.dispatchEvent('sethtml', {editor: this});

        //this.$visualFocus(true);
    };

    this.$propHandlers["output"] = function(value){
        //@todo Update XML
    };

    this.$propHandlers["state"] = function(value){
        this.state = parseInt(value); // make sure it's an int
        // the state has changed, update the button look/ feel
        setTimeout(function() {
            _self.notifyAll(value);
            if (_self.plugins && _self.plugins.isActive('code'))
                _self.notify('code', apf.editor.SELECTED);
        });
    };

    this.$propHandlers["plugins"] = function(value){
        this.$plugins = value && value.splitSafe(value) || null;
    };

    /**
     * @attribute {Boolean} realtime whether the value of the bound data is
     * updated as the user types it, or only when this element looses focus or
     * the user presses enter.
     */
    this.$propHandlers["realtime"] = function(value){
        this.realtime = typeof value == "boolean"
            ? value
            : apf.xmldb.getInheritedAttribute(this.$aml, "realtime") || false;
    };
    
    this.$propHandlers["language"] = function(value){
        // @todo implement realtime language switching
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
                this.oDoc.designMode = 'on';
                if (apf.isGecko) {
                    // Tell Gecko (Firefox 1.5+) to enable or not live resizing of objects
                    this.oDoc.execCommand('enableObjectResizing', false, this.imagehandles);
                    // Disable the standard table editing features of Firefox.
                    this.oDoc.execCommand('enableInlineTableEditing', false, this.tablehandles);
                }
            }
            catch (e) {};
        }
        if (justinited) {
            //this.$propHandlers["value"].call(this, "");
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
        var doc = (!this.oWin.document.compatMode
          || this.oWin.document.compatMode == 'CSS1Compat')
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
        if (!output)
            output = this.output;
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
    this.getValue = function(bStrict) {
        var xhtml = (this.$value = this.exportHtml(this.getXHTML('text'), bStrict));
        if (this.output == "dom") { //@todo might need a bit more love...
            var dom      = apf.getXml('<apf_cool>' + xhtml + '</apf_cool>'),
                fragment = document.createDocumentFragment();
            for (var i = 0, j = dom.childNodes.length; i < j; i++) {
                try {
                    fragment.appendChild(dom.childNodes[i]);
                }
                catch (ex) {}
            }

            return fragment;
        }

        return xhtml;
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
     * API; insert any given text (or HTML) at cursor position into the Editor
     *
     * @param {String}  html
     * @param {Boolean} bNoParse Prevents parsing the HTML, which might alter the string
     * @param {Boolean} bNoFocus Prevents setting the focus back to the editor area
     * @type  {void}
     */
    this.insertHTML = function(html, bNoParse, bNoFocus) {
        if (inited && complete) {
            if (!bNoFocus)
                this.selection.set();
            this.$visualFocus(true);
            this.selection.setContent(bNoParse ? html : this.prepareHtml(html));
            // notify SmartBindings that we changed stuff...
            this.change(this.getValue());
            
            if (bNoFocus) return;
            setTimeout(function() {
                _self.selection.set();
                _self.$visualFocus();
            });
        }
    };

    var prepareRE = null, noMarginTags = {"table":1,"TABLE":1};
    /**
     * Processes, sanitizes and cleanses a string of raw html that originates
     * from outside a contentEditable area, so that the inner workings of the
     * editor are less likely to be affected.
     *
     * @param  {String} html
     * @return The sanitized string, valid to store and use in the editor
     * @type   {String}
     */
    this.prepareHtml = function(html, bNoEnclosing) {
        if (prepareRE === null) {
            // compile 'em regezz
            prepareRE = [
                /<(\/?)strong>|<strong( [^>]+)>/gi,
                /<(\/?)em>|<em( [^>]+)>/gi,
                /&apos;/g,
                /*
                    Ruben: due to a bug in IE and FF this regexp won't fly:
                    /((?:[^<]*|<(?:span|strong|em|u|i|b)[^<]*))<br[^>]*?>/gi, //@todo Ruben: add here more inline html tag names
                */
                /(<(\/?)(span|strong|em|u|i|b|a|strike|sup|sub|font|img)(?:\s+[\s\S]*?)?>)|(<br[\s\S]*?>)|(<(\/?)([\w\-]+)(?:\s+[\s\S]*?)?>)|([^<>]*)/gi, //expensive work around
                /(<a[^>]*href=)([^\s^>]+)*([^>]*>)/gi,
                /<p><\/p>/gi,
                /<a( )([^>]+)\/>|<a\/>/gi
            ];
        }

        // Convert strong and em to b and i in FF since it can't handle them
        if (apf.isGecko) {//@todo what about the other browsers?
            html = html.replace(prepareRE[0], '<$1b$2>')
                       .replace(prepareRE[1], '<$1i$2>');
        }
        else if (apf.isIE) {
            html = html.replace(prepareRE[2], '&#39;') // IE can't handle apos
                       .replace(prepareRE[4], '$1$2 _apf_href=$2$3');
                       //.replace(prepareRE[5], '<p>&nbsp;</p>');

            // <BR>'s need to be replaced to be properly handled as
            // block elements by IE - because they're not converted
            // when an editor command is executed
            var str = [], capture = false, strP = [], depth = [], bdepth = [], lastBlockClosed = false;
            html.replace(prepareRE[3], function(m, inline, close, tag, br, block, bclose, btag, any){
                if (inline) {
                    var id = strP.push(inline);

                    tag = tag.toLowerCase();
                    if (!selfClosing[tag]) {
                        if (close) {
                            if (!depth[depth.length-1] 
                              || depth[depth.length-1][0] != tag) {
                                strP.length--; //ignore non matching tag
                            }
                            else {
                                depth.length--;
                            }
                        }
                        else {
                            depth.push([tag, id]);
                        }
                    }
                    
                    capture = true;
                }
                else if (any) {
                    strP.push(any);
                    capture = true;
                }
                else if (br) {
                    if (capture) {
                        if (depth.length) {
                            strP.push(br);
                        }
                        else {
                            str.push("<p>", strP.join(""), "</p>");
                            strP = [];
                        }
                        
                        if (!depth.length)
                            capture = false;
                    }
                    else {
                        if ((bdepth.length || lastBlockClosed) && br.indexOf("_apf_marker") > -1) {
                            //debugger;
                            //donothing
                        }
                        else
                            str.push("<p>&nbsp;</p>");
                    }
                }
                else if (block){
                    if (bclose) {
                        if (bdepth[bdepth.length-1] != btag.toLowerCase()) {
                            return;
                        }
                        else {
                            bdepth.length--;
                        }
                       
                        if (strP.length) { //Never put P's inside block elements
                            str.push(strP.join(""));
                            strP = [];
                        }
                        
                        lastBlockClosed = 2;
                    }
                    else {
                        var useStrP = strP.length && strP.join("").trim();
                        var last = useStrP ? strP : str;
                        if (!noMarginTags[btag]) {
                            if (last[last.length - 1] == "<p>&nbsp;</p>")
                                last[last.length - 1] = "<p></p>";
                            else if(useStrP && !bdepth.length)
                                last.push("<p></p>");
                        }
                        
                        if (strP.length) {
                            if (!useStrP || bdepth.length) { //Never put P's inside block elements
                                str.push(strP.join(""));
                                strP = [];
                            }
                            else {
                                str.push("<p>", strP.join(""), "</p>");
                                strP = [];
                            }
                        }
                        
                        bdepth.push(btag.toLowerCase());
                    }
                    
                    str.push(block);
                    capture = false;
                }
                
                lastBlockClosed = lastBlockClosed == 2 ? 1 : false;
            });
            var s;
            if ((s = strP.join("")).trim())
                str.push(bNoEnclosing
                 ? s
                 : "<p>" + s + "</p>");
            html = str.join("");
        }

        // Fix some issues
        html = html.replace(prepareRE[6], '<a$1$2></a>');

        return html;
    };

    var exportRE = null, selfClosing = {"br":1,"img":1,"input":1,"hr":1};
    /**
     * Description.
     *
     * @param  {String}  html
     * @param  {Boolean} bStrict
     * @return The same string of html, but then formatted in such a way that it can embedded.
     * @type   {String}
     */
    this.exportHtml = function(html, bStrict, noParagraph) {
        if (exportRE === null) {
            // compile 'em regezz
            exportRE = [
                /<br[^>]*><\/li>/gi,
                /<br[^>]*_apf_placeholder="1"\/?>/gi,
                /<(a|span|div|h1|h2|h3|h4|h5|h6|pre|address)>[\s\n\r\t]*<\/(a|span|div|h1|h2|h3|h4|h5|h6|pre|address)>/gi,
                /<(tr|td)>[\s\n\r\t]*<\/(tr|td)>/gi,
                /[\s]*_apf_href="?[^\s^>]+"?/gi,
                /(".*?"|'.*?')|(\w)=([^'"\s>]+)/gi,
                /<((?:br|input|hr|img)(?:[^>]*[^\/]|))>/ig, // NO! do <br /> see selfClosing
                /<p>&nbsp;$/mig,
                /(<br[^>]*?>(?:[\r\n\s]|&nbsp;)*<br[^>]*?>)|(<(\/?)(span|strong|em|u|i|b|a|br|strike|sup|sub|font|img)(?:\s+.*?)?>)|(<(\/?)([\w\-]+)(?:\s+.*?)?>)|([^<>]*)/gi,
                /<\/p>/gi, //<p>&nbsp;<\/p>|
                /<p>/gi,
                /<\s*\/?\s*(?:\w+:\s*)?[\w-]*[\s>\/]/g
            ];
        }

        if (apf.isIE) {
            html = html.replace(exportRE[7], '<p></p>')
                       .replace(exportRE[9], '<br />')
                       .replace(exportRE[10], '')
        }
        else if (html == "<br>") 
            html = "";

        html = html.replace(exportRE[0], '</li>')
                   .replace(exportRE[1], '')
                   .replace(exportRE[2], '')
                   .replace(exportRE[3], '<$1>&nbsp;</$2>')
                   .replace(exportRE[4], '')
                   .replace(exportRE[6], '<$1 />')
                   .replace(exportRE[11], function(m){return m.toLowerCase();});
                       
        //@todo: Ruben: Maybe make this a setting (paragraphs="true")
        //@todo might be able to unify this function with the one above.
        if (apf.isIE && !noParagraph) {
            var str = [], capture = true, strP = [], depth = [], bdepth = [];
            html.replace(exportRE[8], function(m, br, inline, close, tag, block, bclose, btag, any){
                if (inline) {
                    if (apf.isIE) {
                        inline = inline.replace(exportRE[5], function(m, str, m, v){
                            return str || m + "=\"" + v + "\"";
                        });//'$2="$3"') //quote un-quoted attributes
                    }
                    
                    var id = strP.push(inline);
                    
                    if (!selfClosing[tag]) {
                        if (close) {
                            if (!depth[depth.length-1] 
                              || depth[depth.length-1][0] != tag) {
                                strP.length--; //ignore non matching tag
                            }
                            else {
                                depth.length--;
                            }
                        }
                        else {
                            depth.push([tag, id]);
                        }
                    }
    
                    capture = true;
                }
                else if (any) {
                    strP.push(any);
                    capture = true;
                }
                else if (br) {
                    if (capture) {
                        if (depth.length) {
                            strP.push(br);
                        }
                        else {
                            str.push("<p>", strP.join("").trim() || "&nbsp;", "</p>");
                            strP = [];
                            capture = false;
                        }
                    }
                    else
                        str.push("<p>&nbsp;</p>"); //apf.editor.ALTP.start ... end
                }
                else if (block){
                    if (bclose) {
                        if (bdepth[bdepth.length-1] != btag) {
                            return;
                        }
                        else {
                            bdepth.length--;
                        }
                       
                        if (strP.length) { //Never put P's inside block elements
                            str.push(strP.join(""));
                            strP = [];
                        }
                    }
                    else {
                        if (apf.isIE) {
                            block = block.replace(exportRE[5], function(m, str, m, v){
                                return str || m + "=\"" + v + "\"";
                            });//'$2="$3"') //quote un-quoted attributes
                        }
                        
                        //@todo this section can be make similar to the one in the above function and vice verse
                        var last = strP.length ? strP : str;
                        if (last[last.length - 1] == "<p>&nbsp;</p>")
                            last.length--;
                        
                        if (strP.length) {
                            var s;
                            if (bdepth.length || (s = strP.join("").trim()).replace(/<.*?>/g,"").trim() == "") { //Never put P's inside block elements
                                str.push(s || strP.join(""));
                                strP = [];
                            }
                            else {
                                str.push("<p>", 
                                    (s || strP.join("").trim() || "&nbsp;").replace(/<br \/>[\s\r\n]*$/, ""),
                                    "</p>");
                                strP = [];
                            }
                        }
                        
                        bdepth.push(btag);
                    }
                    
                    str.push(block);
                    capture = false;
                }
            });
            if (strP.length)
                str.push("<p>" + strP.join("").replace(/<br \/>[\s\r\n]*$/, "") + "</p>");
            html = str.join("");
        }
        else {
            html = html.replace(/<br[^>]*_apf_marker="1"[^>]*>/gi, '<br />');
        }
        
        // #ifdef __DEBUG
        // check for VALID XHTML in DEBUG mode...
        try {
            apf.getXml('<source>' + html.replace(/&.{3,5};/g, "") + '</source>');
        }
        catch(ex) {
            apf.console.error(ex.message + "\n" + html.escapeHTML());
        }
        // #endif
        
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
        if (!this.plugins.isPlugin(cmdName) && inited && complete
          && this.state != apf.editor.DISABLED) {
            if (apf.isIE) {
                if (!this.oDoc.body.innerHTML)
                    return commandQueue.push([cmdName, cmdParam]);
                else
                    this.selection.set();
            }

            this.$visualFocus();
            
            if (cmdName.toLowerCase() == "removeformat") {
                /*this.plugins.get('paragraph', 'fontstyle').forEach(function(plugin){
                    if (plugin.queryState(_self) == apf.editor.ON) {
                        plugin.submit(null, 'normal');
                    }
                });*/

                var c = this.selection.getContent();
                var disallowed = {FONT:1, SPAN:1, H1:1, H2:1, H3:1, H4:1, H5:1, 
                    H6:1, PRE:1, ADDRESS:1, BLOCKQUOTE:1, STRONG:1, B:1, U:1,
                    I:1, EM:1, LI:1, OL:1, UL:1, DD:1, DL:1, DT:1};
                c = c.replace(/<\/?(\w+)(?:\s.*?|)>/g, function(m, tag) {
                    return !disallowed[tag] ? m : "";
                });
                if (apf.isIE) {
                    var htmlNode = this.selection.setContent("<div>" + c + "</div>");
                    this.selection.selectNode(htmlNode);
                    htmlNode.removeNode(false);
                    return;
                }
                else {
                    this.selection.setContent(c);
                }
            }

            this.oDoc.execCommand(cmdName, false, cmdParam);

            // make sure that the command didn't leave any <P> tags behind (cleanup)
            cmdName    = cmdName.toLowerCase();
            var bNoSel = (cmdName == "SelectAll");
            if (apf.isIE) {
                if ((cmdName == "insertunorderedlist" || cmdName == "insertorderedlist")
                  && this.getCommandState(cmdName) == apf.editor.OFF) {
                    bNoSel = true;
                }
                else if (cmdName == "outdent") {
                    bNoSel = true;
                    var pLists = this.plugins.get('bullist', 'numlist');
                    if (pLists.length) {
                        if (pLists[0].queryState(_self) != apf.editor.OFF
                          && pLists[1].queryState(_self) != apf.editor.OFF)
                            bNoSel = false;
                    }
                    var oNode = this.selection.getSelectedNode();
                    if (bNoSel && oNode && oNode.tagName == "BLOCKQUOTE")
                        bNoSel = false;
                }
                
                if (bNoSel)
                    this.oDoc.body.innerHTML = this.prepareHtml(this.oDoc.body.innerHTML);
                var r = this.selection.getRange();
                if (r)
                    r.scrollIntoView();
            }
            
            this.notifyAll();
            this.change(this.getValue());

            setTimeout(function() {
                //_self.notifyAll(); // @todo This causes pain, find out why
                if (apf.isIE && !bNoSel)
                   _self.selection.set();
                _self.$visualFocus();
            });
        }
    };

    /**
     * Get the state of a command (on, off or disabled)
     *
     * @param {String} cmdName
     * @type Number
     */
    this.getCommandState = function(cmdName) {
        if (apf.isGecko && (cmdName == "paste" || cmdName == "copy" || cmdName == "cut"))
            return apf.editor.DISABLED;
        try {
            if (!this.oDoc.queryCommandEnabled(cmdName))
                return apf.editor.DISABLED;
            else
                return this.oDoc.queryCommandState(cmdName)
                    ? apf.editor.ON
                    : apf.editor.OFF;
        }
        catch (e) {
            return apf.editor.OFF;
        }
    };

    /**
     * Make an instance of apf.popup (identified with a pointer to the cached
     * DOM node - sCacheId) visible to the user.
     *
     * @param {apf.editor.plugin} oPlugin  The plugin instance
     * @param {String}            sCacheId Pointer to the cached DOM node
     * @param {DOMElement}        oRef     Button node to show popup below to
     * @param {Number}            iWidth   New width of the popup
     * @param {Number}            iHeight  New height of the popup
     * @type  {void}
     */
    this.showPopup = function(oPlugin, sCacheId, oRef, iWidth, iHeight) {
        if (apf.popup.last && apf.popup.last != sCacheId) {
            var o = apf.lookup(apf.popup.last);
            if (o) {
                o.state = apf.editor.OFF;
                this.notify(o.name, o.state);
            }
        }

        //this.selection.cache();
        this.selection.set();
        this.$visualFocus();

        oPlugin.state = apf.editor.ON;
        this.notify(oPlugin.name, apf.editor.ON);

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
                        if (key == 13 && typeof oPlugin['submit'] == "function") //Enter
                            return oPlugin.submit(new apf.AbstractEvent(e));
                    }
                }
            });
        });
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
            var s = _self.getXHTML('text');
            if (s.match(/mso[a-zA-Z]+/i)) { //check for Paste from Word
                var o = _self.plugins.get('pasteword');
                if (o)
                    _self.$propHandlers['value'].call(_self, o.parse(s));
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
            var oNewBm = _self.selection.getBookmark();
            if (typeof oNewBm.start == "undefined" && typeof oNewBm.end == "undefined") {
                //this.selection.moveToBookmark(oBookmark);
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
        if (_self.state == apf.editor.DISABLED) return;
        //if (apf.isIE)
        //    this.$visualFocus(true);
        var ret = _self.plugins.notifyAll('context', e);
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
                    _self.executeCommand(commandQueue[i][0], commandQueue[i][1]);
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
                    if (_self.selection.getType() == 'Control') {
                        _self.selection.remove();
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
                        _self.executeCommand('Bold');
                        found = true;
                        break;
                    case 105: // i
                    case 73:  // I
                        _self.executeCommand('Italic');
                        found = true;
                        break;
                    case 117: // u
                    case 85:  // U
                        _self.executeCommand('Underline');
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
                _self.dispatchEvent('keyenter', {editor: _self, event: e});
        }
        _self.$visualFocus();
        if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
            found = _self.plugins.notifyKeyBindings({
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

        document.onkeydown(e);
        keydownTimer = null;
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
        _self.selection.cache();
        if (keyupTimer != null)
            return;

        function keyupHandler() {
            clearTimeout(keyupTimer);
            if (_self.state == apf.editor.DISABLED) return;
            _self.notifyAll();
            _self.dispatchEvent('typing', {editor: _self, event: e});
            _self.plugins.notifyAll('typing', e.code);
            keyupTimer = null;
        }

        keyupTimer = window.setTimeout(keyupHandler, 200);
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
        var pLists = this.plugins.get('bullist', 'numlist');
        if (!pLists || !pLists.length) return false;
        if (typeof e.shift != "undefined")
           e.shiftKey = e.shift;
        var pList = pLists[0].queryState(this) == apf.editor.ON
            ? pLists[0]
            : pLists[1].queryState(this) == apf.editor.ON
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
        // setting focus to the iframe content, upsets the 'code' plugin
        var bCode = this.plugins.isActive('code');
        if (apf.window.focussed == this && !bCode) {
            try {
                _self.oWin.focus();
            }
            catch(e) {};
        }

        if (bCode) {
            _self.notifyAll(apf.editor.DISABLED);
            _self.notify('code', apf.editor.SELECTED);
        }
        else if (bNotify)
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

        this.setProperty('state', this.plugins.isActive('code')
            ? apf.editor.DISABLED
            : apf.editor.OFF);

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
        return apf.xmldb.isChildOf(this.oDoc, e.srcElement, true);
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

        var bCode = this.plugins.isActive('code');
        if (!this.realtime || bCode)
            this.change(bCode ? this.plugins.get('code').getValue() : this.getValue());

        this.setProperty('state', apf.editor.DISABLED);
    };

    /**
    * Add various event handlers to a <i>Editor</i> object.
    *
    * @type {void}
    */
    this.$addListeners = function() {
        apf.AbstractEvent.addListener(this.oDoc, 'mouseup', onClick);
        //apf.AbstractEvent.addListener(this.oDoc, 'select', onClick.bindWithEvent(this));
        apf.AbstractEvent.addListener(this.oDoc, 'keyup', onKeyup);
        apf.AbstractEvent.addListener(this.oDoc, 'keydown', onKeydown);
        apf.AbstractEvent.addListener(this.oDoc, 'mousedown', function(e){
            e = e || window.event;
            _self.selection.cache();
            apf.popup.forceHide();
            //this.notifyAll();
            document.onmousedown(e);
        });

        apf.AbstractEvent.addListener(this.oDoc, 'contextmenu', onContextmenu);
        apf.AbstractEvent.addListener(this.oDoc, 'focus', function(e) {
            //if (!apf.isIE)
                window.onfocus(e.event);
        });
        apf.AbstractEvent.addListener(this.oDoc, 'blur', function(e) {
            //if (!apf.isIE)
                window.onblur(e.event);
        });

        this.oDoc.host = this;

        apf.AbstractEvent.addListener(this.oDoc.body, 'paste', onPaste);
    };

    //this.addEventListener("contextmenu", onContextmenu);

    /**** Button Handling ****/

    /**
     * Transform the state of a button node to 'enabled'
     *
     * @type {void}
     * @private
     */
    function buttonEnable() {
        apf.setStyleClass(this, 'editor_enabled',
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
        apf.setStyleClass(this, 'editor_disabled',
            ['editor_selected', 'editor_enabled']);
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
        _self.selection.cache();

        apf.setStyleClass(oButton, 'active');
        var item = oButton.getAttribute("type");

        //context 'this' is the buttons' DIV domNode reference
        if (!e._bogus) {
            e.isPlugin = _self.plugins.isPlugin(item);
            e.state    = getState(item, e.isPlugin);
        }

        if (e.state == apf.editor.DISABLED) {
            buttonDisable.call(oButton);
        }
        else {
            if (this.disabled)
                buttonEnable.call(oButton);

            if (e.state == apf.editor.ON) {
                apf.setStyleClass(oButton, 'editor_selected');
                oButton.selected = true;
            }
            else {
                apf.setStyleClass(oButton, '', ['editor_selected']);
                oButton.selected = false;
            }

            if (!e._bogus) {
                if (e.isPlugin) {
                    var o = _self.plugins.active = _self.plugins.get(item);
                    o.execute(_self);
                }
                else
                    _self.executeCommand(item);
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
            var plugin = _self.plugins.get(id);
            if (_self.state == apf.editor.DISABLED && !plugin.noDisable)
                return apf.editor.DISABLED;
            return plugin.queryState
                ? plugin.queryState(_self)
                : _self.state;
        }

        if (_self.state == apf.editor.DISABLED)
            return apf.editor.DISABLED;

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
        if (!this.plugins) //We're in the process of being destroyed
            return;
        
        var oButton = oButtons[item];
        if (!oButton)
            return;

        var oPlugin = this.plugins.get(item);
        if (typeof state == "undefined" || state === null) {
            if (oPlugin && oPlugin.queryState)
                state = oPlugin.queryState(this);
            else
                state = this.getCommandState(item);
        }

        if (oButton.state === state)
            return;

        oButton.state = state;

        if (state == apf.editor.DISABLED)
            buttonDisable.call(oButton);
        else if (state == apf.editor.HIDDEN)
            oButton.style.display = "none";
        else if (state == apf.editor.VISIBLE)
            oButton.style.display = "";
        else {
            if (oButton.style.display == 'none')
                oButton.style.display = "";

            if (oButton.disabled)
                buttonEnable.call(oButton);

            var btnState = (oButton.selected)
                ? apf.editor.ON
                : apf.editor.OFF;

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
        for (var item in oButtons)
            this.notify(item, state);
    };
    
    /**
     * Returns the translated key from a locale pack/ collection
     *
     * @param {String}  key
     * @param {Boolean} bIsPlugin
     * @type  {String}
     * @private
     */
    this.translate = function(key, bIsPlugin) {
        // #ifdef __DEBUG
        if ((!bIsPlugin && !apf.editor.i18n[_self.language][key])
          || (bIsPlugin && !apf.editor.i18n[_self.language]['plugins'][key]))
            apf.console.error('Translation does not exist' 
                + (bIsPlugin ? ' for plugin' : '') + ': ' + key);
        // #endif
        
        return bIsPlugin 
            ? apf.editor.i18n[_self.language]['plugins'][key]
            : apf.editor.i18n[_self.language][key];
    };

    /**** Init ****/

    /**
     * Draw all HTML elements for the editor toolbar
     *
     * @param {HTMLElement} oParent     DOM element which the toolbars should be inserted into
     * @param {String}      [sSkinTag]  Tagname of a toolbar node inside the editor skin definition
     * @param {String}      [sBtnClick] JS that will be executed when a button node is clicked
     * @type  {void}
     */
    this.drawToolbars = function(oParent, sSkinTag, sBtnClick, bAfterRender) {
        var tb, l, k, i, j, z, x, node, buttons, bIsPlugin, item, bNode,
            oNode = this.$getOption('toolbars'),
            plugin, oButton, plugins = this.plugins;

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

            this.$getNewContext("toolbar");
            tb = bAfterRender
                ? apf.xmldb.htmlImport(this.$getLayoutNode("toolbar"), oParent)
                : oParent.appendChild(this.$getLayoutNode("toolbar"));//, oParent.lastChild

            for (z = 0, x = buttons.length; z < x; z++) {
                item = buttons[z];

                if (item == "|") { //seperator!
                    this.$getNewContext("divider");
                    if (bAfterRender)
                        apf.xmldb.htmlImport(this.$getLayoutNode("divider"), tb);
                    else
                        tb.appendChild(this.$getLayoutNode("divider"));
                }
                else {
                    this.$getNewContext("button");
                    oButton = bAfterRender
                        ? oButton = apf.xmldb.htmlImport(this.$getLayoutNode("button"), tb)
                        : oButton = tb.appendChild(this.$getLayoutNode("button"));
                    
                    bIsPlugin = false;
                    // Plugin toolbarbuttons may only be placed inside the main toolbar
                    if (sSkinTag == "toolbar" && !this.$nativeCommands.contains(item)) {
                        plugin = plugins.add(item);
                        // #ifdef __DEBUG
                        if (!plugin)
                            apf.console.error('Plugin \'' + item + '\' can not \
                                               be found and/ or instantiated.',
                                               'editor');
                        // #endif
                        bIsPlugin = true;
                    }

                    if (bIsPlugin) {
                        plugin = plugin || plugins.get(item);
                        if (!plugin)
                            continue;
                        if (plugin.type != apf.editor.TOOLBARITEM)
                            continue;

                        this.$getLayoutNode("button", "label", oButton)
                            .setAttribute("class", 'editor_icon editor_' + plugin.icon);

                        oButton.setAttribute("title", this.translate(plugin.name));
                    }
                    else {
                        this.$getLayoutNode("button", "label", oButton)
                            .setAttribute("class", 'editor_icon editor_' + item);

                        oButton.setAttribute("title", this.translate(item));
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
    
    /**
     * Draw all the HTML elements at startup time.
     *
     * @type {void}
     */
    this.$draw = function() {
        if (this.$aml.getAttribute("plugins")) {
            this.$propHandlers["plugins"]
                .call(this, this.$aml.getAttribute("plugins"));
        }
        if (this.$aml.getAttribute("language")) {
            this.$propHandlers["language"]
                .call(this, this.$aml.getAttribute("language"));
        }

        this.plugins   = new apf.editor.plugins(this.$plugins, this);
        this.selection = new apf.editor.selection(this);

        this.oExt = this.$getExternal("main", null, function(oExt){
            this.drawToolbars(this.$getLayoutNode("main", "toolbar"));
        });
        this.oToolbar = this.$getLayoutNode("main", "toolbar", this.oExt);
        var oEditor   = this.$getLayoutNode("main", "editor",  this.oExt);

        // fetch the DOM references of all toolbar buttons and let the
        // respective plugins finish initialization
        var btns = this.oToolbar.getElementsByTagName("div");
        for (var item, plugin, i = btns.length - 1; i >= 0; i--) {
            item = btns[i].getAttribute("type");
            if (!item) continue;

            oButtons[item] = btns[i];
            plugin = this.plugins.coll[item];
            if (!plugin) continue;

            plugin.buttonNode = btns[i];

            if (plugin.init)
                plugin.init(this);
        }

        this.iframe = document.createElement('iframe');
        this.iframe.setAttribute('frameborder', '0');
        this.iframe.setAttribute('border', '0');
        this.iframe.setAttribute('marginwidth', '0');
        this.iframe.setAttribute('marginheight', '0');
        oEditor.appendChild(this.iframe);
        this.oWin = this.iframe.contentWindow;
        this.oDoc = this.oWin.document;

        // get the document style (CSS) from the skin:
        // see: apf.presentation.getCssString(), where the following statement
        // is derived from.
        var sCss = apf.getXmlValue($xmlns(apf.skins.skins[this.skinName.split(":")[0]].xml,
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
            _self.setProperty('state', apf.editor.DISABLED);
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
        this.plugins.notifyAll("resize");

        if (this.plugins.isActive('code'))
            this.plugins.get('code').setSize(this);
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

        if (apf.xmldb.isOnlyChild(x.firstChild, [3,4]))
            this.$handlePropSet("value", x.firstChild.nodeValue.trim());
        else
            apf.AmlParser.parseChildren(this.$aml, null, this);

        if (typeof this.realtime == "undefined")
            this.$propHandlers["realtime"].call(this);
        
        //apf.ed = this;
        //apf.ed.iframe.contentWindow.document == apf.ed.oDoc
    };

    this.$destroy = function() {
        this.plugins.$destroy();
        this.selection.$destroy();
        this.plugins = this.selection = this.oDoc.host = this.oToobar = 
            this.oDoc = this.oWin = this.iframe = prepareRE = exportRE = null;
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
    apf.Presentation
);

apf.editor.ON             = 1;
apf.editor.OFF            = 0;
apf.editor.DISABLED       = -1;
apf.editor.VISIBLE        = 2;
apf.editor.HIDDEN         = 3;
apf.editor.SELECTED       = 4;

apf.editor.i18n = {
    'en_GB': {
        'cancel': 'Cancel',
        'insert': 'Insert',
        'bold': 'Bold',
        'italic': 'Italic',
        'underline': 'Underline',
        'strikethrough': 'Strikethrough',
        'justifyleft': 'Align text left',
        'justifycenter': 'Center',
        'justifyright': 'Align text right',
        'justifyfull': 'Justify',
        'removeformat': 'Clear formatting',
        'cut': 'Cut',
        'copy': 'Copy',
        'paste': 'Paste',
        'outdent': 'Decrease indent',
        'indent': 'Increase indent',
        'undo': 'Undo',
        'redo': 'Redo',
        // plugin keys:
        'anchor': 'Insert anchor',
        'blockquote': 'Blockquote',
        'charmap': 'Character map',
        'code': 'HTML source view',
        'listitem': 'List item',
        'nbsp': 'Non-breaking space',
        'break': 'Linebreak',
        'paragraph': 'Paragraph',
        'forecolor': 'Font color',
        'backcolor': 'Highlight color',
        'insertdate': 'Insert current date',
        'inserttime': 'Insert current time',
        'rtl': 'Change text direction to right-to-left',
        'ltr': 'Change text direction to left-to-right',
        'emotions': 'Insert emotion',
        'fonts': 'Font',
        'fontsize': 'Font size',
        'fontstyle': 'Font style',
        'blockformat': 'Paragraph style',
        'help': 'Help',
        'hr': 'Insert horizontal rule',
        'image': 'Insert image',
        'imagespecial': 'Choose an image to insert',
        'link': 'Insert hyperlink',
        'unlink': 'Remove hyperlink',
        'bullist': 'Bullets',
        'numlist': 'Numbering',
        'media': 'Insert medium',
        'pastetext': 'Paste plaintext',
        'paste_keyboardmsg': 'Use %s on your keyboard to paste the text into the window.',
        'print': 'Print document',
        'preview': 'Preview document',
        'scayt': 'Turn spellcheck on/ off',
        'search': 'Search',
        'replace': 'Search and Replace',
        'sub': 'Subscript',
        'sup': 'Superscript',
        'table': 'Insert table',
        'table_noun': 'Table',
        'visualaid': 'Toggle visual aid on/ off'
    },
     'nl_NL': {
        'cancel': 'Annuleren',
        'insert': 'Invoegen',
        'bold': 'Vet',
        'italic': 'Schuingedrukt',
        'underline': 'Onderstreept',
        'strikethrough': 'Doorgestreept',
        'justifyleft': 'Recht uitlijnen',
        'justifycenter': 'Centreren',
        'justifyright': 'Rechts uitlijnen',
        'justifyfull': 'Justify',
        'removeformat': 'Stijlen verwijderen',
        'cut': 'Knippen',
        'copy': 'Kopieren',
        'paste': 'Plakken',
        'outdent': 'Inspringen verkleinen',
        'indent': 'Inspringen vergroten',
        'undo': 'Ongedaan maken',
        'redo': 'Opnieuw',
        // plugin keys:
        'anchor': 'Anchor invoegen',
        'blockquote': 'Blockquote',
        'charmap': 'Speciale tekens',
        'code': 'HTML broncode',
        'listitem': 'Lijst item',
        'nbsp': 'Niet-brekende spatie',
        'break': 'Regelafbreuk',
        'paragraph': 'Paragraaf',
        'forecolor': 'Tekstkleur',
        'backcolor': 'Markeerkleur',
        'insertdate': 'Huidige datum invoegen',
        'inserttime': 'Huidige tijd invoegen',
        'rtl': 'Verander tekstrichting naar rechts-naar-links',
        'ltr': 'Verander tekstrichting naar links-naar-rechts',
        'emotions': 'Emoticon invoegen',
        'fonts': 'Lettertype',
        'fontsize': 'Letter grootte',
        'fontstyle': 'Tekststijl',
        'blockformat': 'Paragraafstijl',
        'help': 'Hulp',
        'hr': 'Horizontale lijn invoegen',
        'image': 'Afbeelding invoegen',
        'imagespecial': 'Afbeelding kiezen',
        'link': 'Link invoegen',
        'unlink': 'Link verwijderen',
        'bullist': 'Ongenummerd',
        'numlist': 'Genummerd',
        'media': 'Medium invoegen',
        'pastetext': 'Tekst Plakken',
        'paste_keyboardmsg': 'Gebruik %s op uw toetsenbord om tekst in dit scherm te plakken.',
        'print': 'Printen',
        'preview': 'Voorbeeldvertoning',
        'scayt': 'Spellingscontrole aan/ uit',
        'search': 'Zoeken',
        'replace': 'Zoeken en vervangen',
        'sub': 'Subscript',
        'sup': 'Superscript',
        'table': 'Tabel invoegen',
        'table_noun': 'Tabel',
        'visualaid': 'Visuele hulp aan/ uit'
    }
};

// #endif
