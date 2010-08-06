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

// #ifdef __WITH_SELECTION || __INC_ALL

/**
 * @class apf.selection
 * @constructor
 * @author Mike de Boer  (mike AT javeline DOT com)
 */
apf.selection = function(oWin, oDoc, editor) {
    /*
     * Initialize the apf.selection class.
     *
     * @type apf.selection
     */
    oWin = oWin || window;
    oDoc = oDoc || window.document;
    this.current = null;

    var FUNC  = "function",
        UNDEF = "undefined",
        CHAR  = "character",
        TEXT  = "Text",
        CTRL  = "Control",
        NONE  = "None",
        csLock,
        vfocus = (editor && typeof editor.$visualFocus == FUNC),
        _self  = this;

    /**
     * Get the selection of the editable area
     *
     * @type {Selection}
     */
    this.get = function() {
        return apf.w3cRange ? oWin.getSelection() : oDoc.selection;
    };

    /**
     * Set or move the current selection to the cached one.
     * At the moment, this function is very IE specific and is used to make sure
     * that there's a correct selection object available at all times.
     * @see apf.selection.cache
     * 
     * @type {Range}
     */
    this.set = function() {
        if (!this.current) return null;
        if (apf.w3cRange) {
            this.moveToBookmark(this.current);
            return this.current;
        }

        try {
            if (vfocus)
                editor.$visualFocus();
            else
                oWin.focus();
            this.current.select();
        }
        catch (ex) {}

        if (vfocus)
            editor.$visualFocus();
        else
            oWin.focus();

        return this.current;
    };

    /**
     * Save the selection object/ current range into a global variable to cache
     * it for later use.
     * At the moment, this function is very IE specific and is used to make sure
     * that there's a correct selection object available at all times.
     *
     * @param {Boolean} [w3cToo] Also cache the selection for browsers that support
     *                           the w3c range spec
     * @type {void}
     */
    this.cache = function(w3cToo) {
        if (apf.w3cRange) {
            if (w3cToo)
                this.current = this.getBookmark();
            return this;
        }

        var oSel = oDoc.selection;
        this.current      = oSel.createRange();
        this.current.type = oSel.type;

        if (this.current.type == TEXT && this.current.text == "" && !csLock) {
            csLock = $setTimeout(this.cache, 0);
        }
        else {
            clearTimeout(csLock);
            csLock = null;
        }
        
        return this;
    };

    /**
     * Retrieve the active Range object of the current document selection.
     * Internet Explorer returns a controlRange when a control (e.g. image,
     * object tag) is selected or a textRange when a set of characters is
     * selected.
     *
     * @type {Range}
     */
    this.getRange = function() {
        var oSel = this.get(), range;

        try {
            if (oSel)
                range = oSel.rangeCount > 0
                    ? oSel.getRangeAt(0)
                    : (oSel.createRange
                        ? oSel.createRange()
                        : oDoc.createRange());
        }
        // IE throws unspecified error here if we're placed in a frame/iframe
        catch (ex) {}

        // No range found then create an empty one
        // This can occur when the editor is placed in a hidden container
        // element on Gecko. Or on IE when there was an exception
        if (!range)
            range = apf.w3cRange
                ? oDoc.createRange()
                : oDoc.body.createTextRange();

        return range;
    };

    /**
     * Set the active range of the current selection inside the editable
     * document to a specified range.
     *
     * @param {Range} range
     * @type {void}
     */
    this.setRange = function(range) {
        if (apf.w3cRange) {
            var oSel = this.get();

            if (oSel) {
                oSel.removeAllRanges();
                oSel.addRange(range);
            }
        }
        else {
            try {
                range.select();
            }
            // Needed for some odd IE bug
            catch (ex) {}
        }
        
        return this;
    };

    var activeEl,
        _inline  = "BR|IMG|HR|INPUT",
        _block   = "P|BUTTON|TEXTAREA|SELECT|DIV|H[1-6]|ADDRESS|PRE|OL|UL|LI|TABLE|TBODY|TR|DT|DE|TD|SUB|SUP",
        _form    = "SELECT|BUTTON|TEXTAREA",
        reBlock  = new RegExp("^(?:" + _block  + ")$", "i"),
        reForm   = new RegExp("^(?:" + _form   + ")$", "i"),
        reInline = new RegExp("^(?:" + _inline + ")$", "i");

    this.inline  = _inline;
    this.block   = _block;
    this.form    = _form;

    function trimNl(str) {
        return (apf.isOpera || apf.isIE) ? str : str.replace(/\r\n/g, " ");
    }

    function getText(node) {
        return String(apf.isIE ? node.nodeType == 3 ? node.nodeValue : node.innerText : node.textContent);
    }
    
    function getHtml(node) {
        return String(node.nodeType == 3 ? apf.isIE ? node.nodeValue : node.textContent : node.innerHTML);
    }

    function textContent(node, o) {
        var cn,
            sp       = 0,
            str      = "",
            i        = 0,
            l        = node.childNodes.length;
        for (; i < l; i++) {
            cn = node.childNodes[i];
            if (reForm.test(cn.nodeName)) {
                str += "<->" + (apf.isIE ? "" : trimNl(getText(cn)).replace(/./gi, " ")) + "</->";
            }
            else {
                if (reBlock.test(cn.nodeName)) {
                    str += "<+>" + (apf.isIE ? "" : trimNl(getText(cn)).replace(/./gi, " ")) + "</+>";
                }
                else {
                    if (reInline.test(cn.nodeName)) {
                        str += "<>";
                    }
                    else {
                        if (cn.nodeName == "SPAN" && (sp = _4.attr(cn, "scaytid")))
                            str += "<" + sp + ">" + trimNl(getHtml(cn)) + "</>";
                        else
                            str += trimNl(getHtml(cn));
                    }
                }
            }
        }
        return str;
    }

    function getParent(node, eltype, attr, root) {
        var k;
        root = root || this.containerNode;
        eltype = eltype ? new RegExp("^(?:" + eltype + ")$") : null;
        while (node && node != root) {
            if (eltype && eltype.test(node.nodeName.toUpperCase())) {
                return node;
            }
            if (attr) {
                for (k in attr) {
                    if (node.getAttribute(k) !== null && attr[k] === null)
                        return node;
                    if ((attr[k] !== null && node.getAttribute(k) !== null
                      && !(node.getAttribute(k) === false)) ? !attr[k] : attr[k]) {
                        return node;
                    }
                }
            }
            node = node.parentNode;
        }
        return false;
    }

    /**
     * Returns a bookmark location for the current selection. This bookmark
     * object can then be used to restore the selection after some content
     * modification to the document.
     *
     * @param  {Boolean}    [type]     State if the bookmark should be simple or not.
     *                                 Default is complex.
     * @param  {Function}   [callback] function used to retrieve a custom reference node
     * @return {Object}                Bookmark object, use moveToBookmark with this
     *                                 object to restore the selection.
     */
    this.getBookmark = function(type, callback) {
        var ch    = -16777215,
            range = this.getRange(),
            vp    = apf.getViewPort(oWin),
            c     = oDoc.body,
            o     = {
                scrollX : vp.x,
                scrollY : vp.y,
                collapse: 0,
                start   : 0
            },
            sel = this.get();

        activeEl = null;
        if (type == "simple") {
            o.rng = range;
            return o;
        }
        if (!apf.w3cRange) {
            if (range.item) {
                var e = range.item(0),
                    n = c.getElementsByTagName(e.nodeName),
                    i = 0,
                    l = n.length;
                for (; i < l; i++) {
                    if (e == n[i])
                        return !(sp = i);
                }
                return apf.extend(o, {
                    tag  : e.nodeName,
                    index: sp
                });
            }
            var tr, bp, sp, tr1;
            tr = range.duplicate();
            tr.moveToElementText(c);
            tr.collapse(true);
            bp = Math.abs(tr.move(CHAR, ch));
            tr = range.duplicate();
            tr.collapse(true);
            sp = Math.abs(tr.move(CHAR, ch));
            tr = range.duplicate();
            tr.collapse(false);
            var offset = 0;
            tr1 = tr.duplicate();
            tr1.moveEnd(CHAR, 1);
            tr1.collapse(false);
            var parN = tr1.parentElement();
            if (reBlock.test(parN.nodeName)) {
                if (getParent(tr.parentElement(), _block, null, c) != parN)
                    activeEl = parN;
            }
            return apf.extend(o, {
                start : sp - bp - offset,
                length: Math.abs(tr.move(CHAR, ch)) - sp
            });
        }
        var p = sel.anchorNode; //getParentElement()
        while (p && (p.nodeType != 1))
            p = p.parentNode;
        if (p && p.nodeName == "IMG") {
            return o;
        }
        if (!sel)
            return null;

        var w,
            sc     = range.startContainer,
            an     = sel.anchorNode,
            custom = callback ? callback(an) : null;
        if (sel.isCollapsed && an) {
            o.collapse = 1;
            p = getParent(an, _block) || c;
            if (an.nodeType == 3) {
                w = oDoc.createTreeWalker(p, NodeFilter.SHOW_TEXT, null, false);
                while (n = w.nextNode()) {
                    if (n == an) {
                        o.start = o.start + sel.anchorOffset;
                        break;
                    }
                    o.start += trimNl(n.nodeValue || "").length;
                }
            }
            else {
                if (an != p) {
                    w = oDoc.createTreeWalker(p, NodeFilter.SHOW_ALL, null, false);
                    while (n = w.nextNode()) {
                        if (n == an)
                            break;
                        o.start += trimNl(n.nodeValue || "").length;
                    }
                }
                for (i = 0, l = range.startOffset; i < l; i++)
                    o.start += parseInt(String(sc.childNodes[i].textContent).length);
            }
            o.end = o.start;
            if (!custom) {
                o.content = sc.textContent || sc.innerHTML;
                try {
                    if (range.startOffset == 0 && sc.previousSibling
                      && (/IMG|BR|INPUT/.test(sc.previousSibling.nodeName))) {
                        o.br = sc.previousSibling;
                    }
                    if (sc.childNodes[range.startOffset - 1]
                      && (/IMG|BR|INPUT/.test(sc.childNodes[range.startOffset - 1].nodeName))) {
                        o.br = sc.childNodes[range.startOffset - 1];
                    }
                }
                catch(e) {}
            }
            if (custom && range.startOffset == 0) {
                n = custom.previousSibling;
                while (n && ((n.nodeType == 3 && n.textContent == "")
                  || (n.nodeType != 3 && n.innerHTML == ""))) {
                    if (n && (/IMG|BR|INPUT/.test(n.nodeName))) {
                        o.br = n;
                        o.br2 = n.nextSibling;
                        break;
                    }
                    n = n.previousSibling;
                }
            }
            apf.extend(o, {
                block : p,
                node  : sc,
                offset: range.startOffset
            });
            return o;
        }
        var s = [];
        p = 0;
        w = oDoc.createTreeWalker(c, NodeFilter.SHOW_TEXT, null, false);
        while ((n = w.nextNode()) != null) {
            if (n == sc)
                s[0] = p;
            if (n == range.endContainer) {
                s[1] = p;
                break;
            }
            p += trimNl(n.nodeValue || "").length;
        }
        apf.extend(o, {
            start: s[0] + range.startOffset,
            end  : s[1] + range.endOffset,
            block: c
        });
        return o;
    };

    /**
     * Restores the selection to the specified bookmark.
     *
     * @param {Object}   b Bookmark to restore selection from.
     * @return {Boolean} true/false if it was successful or not.
     */
    this.moveToBookmark = function(b) {
        var crt,
            sel = this.get(),
            c   = oDoc.body,
            rng = this.getRange();

        function getPos(sp, ep) {
            var n, par, nv, nvl, o,
                p = 0,
                d = {},
                k = -1,
                w = oDoc.createTreeWalker(b.block, NodeFilter.SHOW_TEXT, null, false);
            while (n = w.nextNode()) {
                nv  = n.nodeValue || "";
                nvl = trimNl(nv).length;
                p  += nvl;
                if (b.collapse) {
                    if (p >= sp)
                        par = getParent(n, _block) || c;
                    if (p == sp)
                        k = par == b.block ? 1 : 0;
                    if (k == -1 && p > sp || k == 1) {
                        d.endNode   = d.startNode = n;
                        d.endOffset = d.startOffset = sp - (p - nvl);
                        return d;
                    }
                }
                else {
                    if (p >= sp && !d.startNode) {
                        o = sp - (p - nvl);
                        d.startNode = n;
                        d.startOffset = sp - (p - nvl);
                    }
                    if (p >= ep) {
                        d.endNode = n;
                        d.endOffset = ep - (p - nvl);
                        return d;
                    }
                }
            }
            return null;
        }
        
        if (!b)
            return false;

        if (!apf.w3cRange) {
            oDoc.body.setActive();
            if (crt = b.rng) {
                try {
                    crt.select();
                }
                catch(ex) {}
                return true;
            }
            if (b.tag) {
                crt = c.createControlRange();
                var n = oDoc.getElementsByTagName(b.tag),
                    i = 0,
                    l = n.length;
                for (; i < l; i++) {
                    if (i == b.index)
                        crt.addElement(n[i]);
                }
            }
            else {
                try {
                    if (b.start < 0) {
                        return true;
                    }
                    crt = sel.createRange();
                    if (activeEl) {
                        crt.moveToElementText(activeEl);
                        crt.moveStart(CHAR, -2);
                        crt.expand(word);
                        crt.collapse(false);
                    }
                    else {
                        crt.moveToElementText(c);
                        crt.collapse(true);
                        crt.moveStart(CHAR, b.start);
                        crt.moveEnd(CHAR, b.length);
                    }
                }
                catch(e) {
                    return true;
                }
            }
            try {
                crt.select();
            }
            catch(ex) {}
            return true;
        }
        if (!sel)
            return false;

        crt = rng.cloneRange();
        if (b.rng) {
            sel.removeAllRanges();
            sel.addRange(b.rng);
        }
        else {
            if (typeof b.node != UNDEF) {
                var a = false;
                if ((b.node.nodeType == 3 && b.node.parentNode != null 
                  && b.node.textContent == b.content) || (b.node.nodeType != 3
                  && b.node.innerHTML == b.content)) {
                    crt.setStart(b.node, b.offset);
                    crt.collapse(true);
                    a = true;
                }
                if (typeof b.br != UNDEF && (/IMG|BR|INPUT/.test(b.br.nodeName))) {
                    if (b.br.nextSibling) {
                        crt.selectNode(b.br.nextSibling);
                        crt.collapse(true);
                    }
                    else {
                        crt.selectNode(b.br);
                        crt.collapse(false);
                    }
                    a = true;
                }
                if (a) {
                    if (!apf.isOpera)
                        sel.removeAllRanges();
                    sel.addRange(crt);
                    c.focus();
                    oWin.scrollTo(b.scrollX, b.scrollY);
                    return;
                }
            }
            if (typeof b.start != UNDEF && typeof b.end != UNDEF) {
                try {
                    var sd = getPos(b.start, b.end);
                    if (sd) {
                        crt.setStart(sd.startNode, sd.startOffset);
                        crt.setEnd(sd.endNode, sd.endOffset);
                        oWin.scrollTo(b.scrollX, b.scrollY);
                        if (!apf.isOpera)
                            sel.removeAllRanges();
                        sel.addRange(crt);
                    }
                }
                catch(ex) {
                    apf.console.error(ex);
                }
            }
            return;
        }
    };

    /**
     * Retrieve the contents of the currently active selection/ range as a
     * string of HTML.
     *
     * @type {String}
     */
    this.getContent = function(retType) {
        if (typeof retType != "string")
            retType = "html"
        var range = this.getRange(), oSel = this.get(), prefix, suffix, n,
            oNode = oDoc.body;
        
        if (retType == "text")
             return this.isCollapsed() ? '' : (range.text || (oSel.toString ? oSel.toString() : ''));

        if (this.isCollapsed())
            return "";
        
        if (typeof range.htmlText != UNDEF)
            return range.htmlText;

        
        var pNode, n = range.cloneContents();
        if (!n.childNodes.length)
            return "";
        
        pNode = n.childNodes[0].ownerDocument.createElement("div");
        pNode.appendChild(n);
        return pNode.innerHTML;

        /*
        prefix = suffix = '';
        //if (editor && editor.output == 'text')
            //return this.isCollapsed() ? '' : (range.htmlText || (range.item
            //   && range.item(0).outerHTML) || '');

        if (range.cloneContents) {
            n = range.cloneContents();
            if (n)
                oNode.appendChild(n);
        }
        else if (typeof range.item != UNDEF || typeof range.htmlText != UNDEF)
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
        return this.isCollapsed() ? '' : prefix + oNode.outerHTML + suffix;*/
    }

    /**
     * Alter the content of the current selection/ active range by setting its
     * contents with some other specified HTML
     *
     * @param {String} html
     * @type {void}
     * @return A reference to the HTML node which has been inserted or its direct parent
     */
    this.setContent = function(html, bNoPrepare) {
        var range = this.getRange();

        // #ifdef __WITH_HTML_CLEANER
        if (!bNoPrepare)
            html = apf.htmlCleaner.prepare(html, true);
        // #endif

        if (range.insertNode) {
            // Make caret marker since insertNode places the caret in the
            // beginning of text after insert
            html += '<span id="__caret">_</span>';

            // Delete and insert new node
            range.deleteContents();
            range.insertNode(this.getRange().createContextualFragment(html));

            // Move to caret marker
            var oCaret = oDoc.getElementById('__caret');
            var htmlNode = oCaret.previousSibling;

            // Make sure we wrap it completely, Opera fails with a simple
            // select call
            range = oDoc.createRange();
            range.setStartBefore(oCaret);
            range.setEndAfter(oCaret);
            this.setRange(range);

            // Delete the marker, and hopefully the caret gets placed in the
            // right location
            oDoc.execCommand('Delete', false, null);

            // In case it's still there
            if (oCaret && oCaret.parentNode)
                oCaret.parentNode.removeChild(oCaret);
                
            return htmlNode;
        }
        else {
            if (range.item) {
                // Delete content and get caret text selection
                this.remove();
                range = this.getRange();
            }

            html = html.replace(/^<(\w+)/, '<$1 id="__caret"');
            range.pasteHTML(html);
            var htmlNode = oDoc.getElementById('__caret');
            if (htmlNode) {
                htmlNode.removeAttribute("id");
                return htmlNode;
            }
        }
    }

    var styleObjNodes = {
        img   : 1,
        hr    : 1,
        li    : 1,
        table : 1,
        tr    : 1,
        td    : 1,
        embed : 1,
        object: 1,
        ol    : 1,
        ul    : 1
    };

    /**
     * Get the type of selection of the editable area
     *
     * @type String
     */
    this.getType = function() {
        var oSel = this.get();
        if (apf.isIE) {
            return oSel.type;
        }
        else {
            // By default set the type to "Text".
            var type = 'Text' ;
            // Check if the actual selection is a Control (IMG, TABLE, HR, etc...).
            if (oSel && oSel.rangeCount == 1) {
                var range = oSel.getRangeAt(0);
                if (range.startContainer == range.endContainer
                  && (range.endOffset - range.startOffset) == 1
                  && range.startContainer.nodeType == 1
                  && styleObjNodes[range.startContainer
                       .childNodes[range.startOffset].nodeName.toLowerCase()]) {
                    type = CTRL;
                }
            }
            return type;
        }
    };

    /**
     * Retrieve the currently selected element from the editable area
     *
     * @return {DOMObject} Currently selected element or common ancestor element
     */
    this.getSelectedNode = function() {
        var range = this.getRange();

        if (!apf.isIE) {
            // Range maybe lost after the editor is made visible again
            if (!range)
                return oDoc;

            var oSel = this.get(), oNode = range.commonAncestorContainer;

            // Handle selection as image or other control like element such
            // as anchors
            if (!range.collapsed) {
                // If the anchor node is an element instead of a text node then
                // return this element
                if (apf.isWebkit && oSel.anchorNode && oSel.anchorNode.nodeType == 1)
                    return oSel.anchorNode.childNodes[oSel.anchorOffset];

                if (range.startContainer == range.endContainer) {
                    if (range.startOffset - range.endOffset < 2) {
                        if (range.startContainer.hasChildNodes())
                            oNode = range.startContainer.childNodes[range.startOffset];
                    }
                }
            }

            //oNode = oNode.parentNode;
            //while (oNode && oNode.parentNode && oNode.nodeType != 1)
            //    oNode = oNode.parentNode;
            return oNode;
        }

        return range.item ? range.item(0) : range.parentElement();
    };

    /**
     * Retrieve the parent node of the currently selected element from the
     * editable area
     *
     * @type DOMObject
     */
    this.getParentNode = function() {
        switch (this.getType()) {
            case CTRL :
                if (apf.isIE)
                    return this.getSelectedNode().parentElement;
                else
                    return this.getSelectedNode().parentNode;
            case NONE :
                return;
            default :
                var oSel = this.get();
                if (apf.isIE) {
                    return oSel.createRange().parentElement();
                }
                else {
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
     *
     * @param {DOMObject} node
     * @type void
     */
    this.selectNode = function(node) {
        var oSel, range;
        
        //@todo Mike please check this!
        while (node.nodeType == 1 && node.firstChild)
            node = node.firstChild;

        if (apf.isIE) {
            oSel = this.get();
            
            if (!node)
                node = oSel.createRange().parentElement();
            
            try{
                oSel.empty();
            }catch(e){}

            try {
                // Try to select the node as a control.
                range = oDoc.body.createControlRange();
                range.addElement(node);
            }
            catch (e) {
                // If failed, select it as a text range.
                range = oDoc.body.createTextRange();
                try {
                    range.moveToElementText(node.nodeType != 1 
                        ? node.parentNode 
                        : node);
                }
                catch (e2) {
                    if (node.nodeValue)
                        range.findText(node.nodeValue);
                }
            }
            try{
                range.select();
            }catch(e){}
        }
        else {
            range = this.getRange();
            if (node)
                range.selectNode(node);
            oSel  = this.get();
            oSel.removeAllRanges();
            oSel.addRange(range);
        }
        
        return this;
    };

    /**
     * Collapse the selection to start or end of range.
     *
     * @param {Boolean} [toEnd] Boolean state if to collapse to end or
     *                          not. Defaults to start.
     * @type  {void}
     */
    this.collapse = function(toEnd) {
        var range = this.getRange(), n;

        // 'Control' range on IE
        if (range.item) {
            n = range.item(0);
            range = oDoc.body.createTextRange();
            range.moveToElementText(n);
        }

        range.collapse(!!toEnd);
        this.setRange(range);
        
        return this;
    };

    /**
     * Checks if the active range is in a collapsed state or not.
     *
     * @type {Boolean}
     */
    this.isCollapsed = function() {
        var range = this.getRange(), oSel = this.get();

        if (!range || range.item)
            return false;

        return !oSel || range.boundingWidth == 0 || range.collapsed;
    };

    /**
     * Check if the currently selected element has any parent node(s) with the
     * specified tagname
     *
     * @param {String} nodeTagName
     * @type  {Boolean}
     */
    this.hasAncestorNode = function(nodeTagName) {
        var oContainer, range = this.getRange();
        if (this.getType() == CTRL || !apf.isIE) {
            oContainer = this.getSelectedNode();
            if (!oContainer && !apf.isIE) {
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
            if (apf.isIE)
                if (oContainer.tagName == nodeTagName)
                    return true;
                else if (oContainer.nodeType == 1
                  && oContainer.tagName == nodeTagName)
                    return true;
            oContainer = oContainer.parentNode;
        }
        return false ;
    };

    /**
     * Move the selection to a parent element of the currently selected node
     * with the specified tagname
     *
     * @param {String} nodeTagName
     * @type  {void}
     */
    this.moveToAncestorNode = function(nodeTagName) {
        var oNode, i, range = this.getRange();
        nodeTagName = nodeTagName.toUpperCase();
        if (apf.isIE) {
            if (this.getType() == CTRL) {
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
                oContainer = oWin.getSelection().getRangeAt(0).startContainer
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
     *
     * @type {Selection}
     */
    this.remove = function() {
        var oSel = this.get(), i;
        if (apf.isIE) {
            if (oSel.type != NONE)
                oSel.clear();
        }
        else if (oSel) {
            for (i = 0; i < oSel.rangeCount; i++)
                oSel.getRangeAt(i).deleteContents();
        }
        return this;
    };

    this.$destroy = function() {
        oWin = oDoc = editor = this.current = _self = null;
        delete oWin;
        delete oDoc;
        delete editor;
        delete this.current;
        delete _self;
    };
};
// #endif