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
        }

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
        var range = this.getRange(), sel = this.getSelection(), sd, nvl, nv;
        
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

            this.editor.$visualFocus();

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
                    this.editor.$visualFocus();
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

    var styleObjNodes = {
        img: 1,
        hr: 1,
        li: 1,
        table: 1,
        tr: 1,
        td: 1,
        embed: 1,
        object: 1,
        ol: 1,
        ul: 1
    };
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
            // By default set the type to "Text".
            var type = 'Text' ;
            // Check if the actual selection is a Control (IMG, TABLE, HR, etc...).
            if (sel && sel.rangeCount == 1) {
                var range = sel.getRangeAt(0);
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
     * @type DOMObject
     * @return Currently selected element or common ancestor element
     */
    this.getSelectedNode = function() {
        var range = this.getRange();

        if (!jpf.isIE) {
            // Range maybe lost after the editor is made visible again
            if (!range)
                return this.editor.oDoc;

            var sel = this.getSelection(), oNode = range.commonAncestorContainer;

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
        //this.editor.setFocus();
        var sel, range;
        if (jpf.isIE) {
            sel = this.getSelection();
            sel.empty();
            try {
                // Try to select the node as a control.
                range = document.body.createControlRange();
                range.addElement(node);
            }
            catch (e) {
                // If failed, select it as a text range.
                range = document.body.createTextRange() ;
                range.moveToElementText(node);
            }
            range.select();
        }
        else {
            range = this.getRange();
            range.selectNode(node);
            sel   = this.getSelection();
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