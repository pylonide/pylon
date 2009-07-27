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

    var csLock,
        vfocus = (editor && typeof editor.$visualFocus == "function"),
        _self  = this;

    /**
     * Get the selection of the editable area
     *
     * @type {Selection}
     */
    this.get = function() {
        return oDoc.selection
            ? oDoc.selection
            : oWin.getSelection()
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
        if (!apf.isIE || !this.current) return;

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
     * @type {void}
     */
    this.cache = function() {
        if (!apf.isIE) return this;
        var oSel = oDoc.selection;
        _self.current      = oSel.createRange();
        _self.current.type = oSel.type;

        if (_self.current.type == "Text" && _self.current.text == "" && !csLock) {
            csLock = setTimeout(_self.cache, 0);
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
            range = apf.isIE
                ? oDoc.body.createTextRange()
                : oDoc.createRange();

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
        if (!apf.isIE) {
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

    /**
     * Returns a bookmark location for the current selection. This bookmark
     * object can then be used to restore the selection after some content
     * modification to the document.
     *
     * @param  {Boolean}    [type] State if the bookmark should be simple or not.
     *                             Default is complex.
     * @return {Object}            Bookmark object, use moveToBookmark with this
     *                             object to restore the selection.
     */
    this.getBookmark = function(type) {
        var range    = this.getRange(),
            viewport = apf.getViewPort(oWin);

        // Simple bookmark fast but not as persistent
        if (type == 'simple')
            return {range : range, scrollX : viewport.x, scrollY : viewport.y};

        var oEl, sp, bp, iLength,
            oRoot = oDoc.body;

        // Handle IE
        if (apf.isIE) {
            // Control selection
            if (range.item) {
                oEl = range.item(0);

                var aNodes = oDoc.getElementsByTagName(oEl.nodeName);
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
            var tRange = oDoc.body.createTextRange();
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
        oEl      = this.getSelectedNode();
        var oSel = this.get();

        if (!oSel)
            return null;

        // Image selection
        if (oEl && oEl.nodeName == 'IMG') {
            return {
                scrollX : viewport.x,
                scrollY : viewport.y
            };
        }

        // Text selection
        function getPos(sn, en) {
            var w = oDoc.createTreeWalker(oRoot, NodeFilter.SHOW_TEXT, null, false),
                n, p = 0, d = {};

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
        }

        var wb = 0, wa = 0;

        // Caret or selection
        if (oSel.anchorNode == oSel.focusNode && oSel.anchorOffset == oSel.focusOffset) {
            oEl = getPos(oSel.anchorNode, oSel.focusNode);
            if (!oEl)
                return {scrollX : viewport.x, scrollY : viewport.y};
            // Count whitespace before
            (oSel.anchorNode.nodeValue || '').trim().replace(/^\s+/, function(a) {
                wb = a.length;
            });

            return {
                start  : Math.max(oEl.start + oSel.anchorOffset - wb, 0),
                end    : Math.max(oEl.end + oSel.focusOffset - wb, 0),
                scrollX: viewport.x,
                scrollY: viewport.y,
                begin  : oSel.anchorOffset - wb == 0
            };
        }
        else {
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
     * @return {Boolean} true/false if it was successful or not.
     */
    this.moveToBookmark = function(bmark) {
        var range = this.getRange(), oSel = this.get(), sd, nvl, nv;

        var oRoot = oDoc.body;
        if (!bmark)
            return false;

        oWin.scrollTo(bmark.scrollX, bmark.scrollY);

        // Handle explorer
        if (apf.isIE) {
            // Handle simple
            if (range = bmark.range) {
                try {
                    range.select();
                }
                catch (ex) {}
                return true;
            }

            if (vfocus)
                editor.$visualFocus();
            else
                oWin.focus();

            // Handle control bookmark
            if (bmark.tag) {
                range = oRoot.createControlRange();
                var aNodes = oDoc.getElementsByTagName(bmark.tag);
                for (var i = 0; i < aNodes.length; i++) {
                    if (i == bmark.index)
                        range.addElement(aNodes[i]);
                }
            }
            else {
                // Try/catch needed since this operation breaks when the editor
                // is placed in hidden divs/tabs
                try {
                    // Incorrect bookmark
                    if (bmark.start < 0)
                        return true;
                    range = oSel.createRange();
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
            catch (ex) {} // Needed for some odd IE bug
            return true;
        }

        // Handle W3C
        if (!oSel)
            return false;

        // Handle simple
        if (bmark.range) {
            oSel.removeAllRanges();
            oSel.addRange(bmark.range);
        }
        else if (typeof bmark.start != "undefined" && typeof bmark.end != "undefined") {
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
                    oSel.removeAllRanges();
                    oSel.addRange(range);
                }

                if (!apf.isOpera) {
                    if (vfocus)
                        editor.$visualFocus();
                    else
                        oWin.focus();
                }
            }
            catch (ex) {}
        }
    }

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
        
        if (typeof range.htmlText != "undefined")
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

        // #ifdef __PARSER_HTML
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
                    type = 'Control';
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
                if (apf.isSafari && oSel.anchorNode && oSel.anchorNode.nodeType == 1)
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
            case "Control" :
                if (apf.isIE)
                    return this.getSelectedNode().parentElement;
                else
                    return this.getSelectedNode().parentNode;
            case "None" :
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
        if (this.getType() == "Control" || !apf.isIE) {
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
            if (oSel.type.toLowerCase() != "none")
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
