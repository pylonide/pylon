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

// #ifdef __ENABLE_EDITOR_FONTS || __INC_ALL

jpf.editor.plugin('fontstyle', function() {
    this.name         = 'fontstyle';
    this.icon         = 'fontstyle';
    this.type         = jpf.editor.TOOLBARITEM;
    this.subType      = jpf.editor.TOOLBARPANEL;
    this.hook         = 'ontoolbar';
    this.buttonNode   = null;
    this.state        = jpf.editor.OFF;

    var panelBody, oStyles = null;

    function getStyles(editor) {
        if (!oStyles) {
            // parse font styles from skin definition
            var node, aCss, bCss, oNode = editor.$getOption('fontstyles');
            // #ifdef __DEBUG
            if (!oNode || !oNode.childNodes)
                throw new Error(jpf.formatErrorString(0, editor,
                    "Initializing plugin: fontstyle",
                    "No fontstyle block found in skin definition"));
            // #endif
            for (var i = 0, j = oNode.childNodes.length; i < j && !oStyles; i++) {
                node = oNode.childNodes[i];
                if (node.nodeType == 3 || node.nodeType == 4) {
                    var s = node.nodeValue.splitSafe("(=|\{|\})");
                    // #ifdef __DEBUG
                    if (s[3] != "{" || s[5] != "}")
                        throw new Error(jpf.formatErrorString(0, editor,
                            "Initializing plugin: fontstyle",
                            "Invalid fontstyle block, please check if formatting rules have been applied"));
                    // #endif
                    oStyles = {};
                    aCss    = [];
                    bCss    = [];
                    for (var cname, k = 0, l = s.length; k < l; k += 6) {
                        if (!s[k] || !s[k + 5]) continue; // check if the first and last key are present
                        cname = s[k + 2].replace(/\.([\w]+)/, "$1");
                        oStyles[cname] = {
                            caption: s[k],
                            cname  : cname,
                            css    : "." + cname + s[k + 3]
                                     + s[k + 4].replace(/\s+/g, '') + s[k + 5],
                            node   : null
                        }
                        aCss.push(oStyles[cname].css);
                        bCss.push(".editor_fontstyle" + oStyles[cname].css);
                    }
                }
            }

            if (aCss.length) {
                // insert resulting CSS into container document AND inside the
                // document of the editor's iframe
                jpf.importCssString(window.document, bCss.join(""));
                jpf.importCssString(editor.oDoc, aCss.join(""));
                if (jpf.isIE) {
                    var nodes = editor.oDoc.getElementsByTagName('head')[0].childNodes;
                    var cnt   = nodes.length -  1;
                    while (cnt) {
                        if (nodes[cnt].nodeType == 3) //text
                            nodes[cnt].parentNode.removeChild(nodes[cnt]);
                        cnt--;
                    }
                }
            }
        }
        return oStyles;
    }

    this.init = function(editor) {
        this.buttonNode.className = this.buttonNode.className + " fontstylepicker";
        this.stylePreview = this.buttonNode.getElementsByTagName('span')[0];
        this.stylePreview.className += " fontstylepreview";
        var styleArrow = this.buttonNode.appendChild(document.createElement('span'));
        styleArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;

            jpf.popup.setContent(this.uniqueId, this.createPanelBody(editor));
        }
        this.editor.showPopup(this, this.uniqueId, this.buttonNode, 203);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    function getCurrentStyle(editor) {
        getStyles(editor);

        var oNode = editor.selection.getSelectedNode();
        while (oNode.nodeType != 1) // we need a block element
            oNode = oNode.parentNode;

        var oCurrent;
        while (!oCurrent && oNode && oNode.tagName != "BODY") {
            var cs = oNode.className;
            for (var i in oStyles) {
                if (cs.indexOf(i) > -1) {
                    oCurrent = oStyles[i];
                    oCurrent.node = oNode;
                }
            }
            oNode = oNode.parentNode;
        }

        return oCurrent;
    }

    this.submit = function(e) {
        e = new jpf.AbstractEvent(e || window.event);
        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        var sStyle = e.target.getAttribute('rel');
        if (sStyle) {
            jpf.popup.forceHide();

            this.editor.selection.set();
            this.editor.$visualFocus();

            var o = getCurrentStyle(this.editor);
            if (o && o.node == this.editor.getSelectedNode()) {
                if (o.cname == sStyle) return;
                jpf.setStyleClass(o.node, sStyle, [o.cname]);
            }
            else {
                var s = this.editor.selection.getContent();
                if (s.trim() == "") return;
                this.editor.selection.setContent('<span class="' + sStyle + '">'
                    + s + '</span>');
            }

        }
    };

    this.queryState = function(editor) {
        var o = getCurrentStyle(editor);
        if (o) {
            if (this.stylePreview.innerHTML != o.caption)
                this.stylePreview.innerHTML = o.caption;
            this.state = jpf.editor.ON;
        }
        else {
            this.stylePreview.innerHTML = "Style";
            this.state = jpf.editor.OFF;
        }

        return this.state;
    };

    this.createPanelBody = function(editor) {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        panelBody.style.visibility = "hidden";

        getStyles(editor);
        var aHtml = [];
        for (var i in oStyles) {
            aHtml.push('<a class="editor_panelcell editor_fontstyle" rel="',
                i, '" href="javascript:;" onmousedown="jpf.lookup(',
                this.uniqueId, ').submit(event);"><span class="', i, '">',
                oStyles[i].caption, '</span></a>')
        }
        panelBody.innerHTML = aHtml.join('');

        setTimeout(function() {
            panelBody.style.visibility = "visible";
        });
        return panelBody;
    };
});

//##############################################################################

jpf.editor.plugin('paragraph', function() {
    this.name         = 'paragraph';
    this.icon         = 'paragraph';
    this.type         = jpf.editor.TOOLBARITEM;
    this.subType      = jpf.editor.TOOLBARPANEL;
    this.hook         = 'ontoolbar';
    this.buttonNode   = null;
    this.state        = jpf.editor.OFF;

    var panelBody;

    // this hashmap maps font size number to it's equivalent in points (pt)
    var blocksMap = {
        'p'       : 'Paragraph',
        'pre'     : 'Preformatted',
        'address' : 'Address',
        'h1'      : 'Header 1',
        'h2'      : 'Header 2',
        'h3'      : 'Header 3',
        'h4'      : 'Header 4',
        'h5'      : 'Header 5',
        'h6'      : 'Header 6'
    };

    var blockFormats = null;

    function getFormats(editor) {
        if (!blockFormats) {
            // parse font styles from skin definition
            var i, j, node, oNode = editor.$getOption('blockformats');
            // #ifdef __DEBUG
            if (!oNode || !oNode.childNodes)
                throw new Error(jpf.formatErrorString(0, editor,
                    "Initializing plugin: Paragraph (blockformats)",
                    "No block formats found in skin definition"));
            // #endif
            for (i = 0, j = oNode.childNodes.length; i < j; i++) {
                node = oNode.childNodes[i];
                if (node.nodeType == 3 || node.nodeType == 4)
                    blockFormats = node.nodeValue.splitSafe(",");
            }
        }
        return blockFormats;
    }

    this.init = function(editor) {
        this.buttonNode.className = this.buttonNode.className + " paragraphpicker";
        this.blockPreview = this.buttonNode.getElementsByTagName('span')[0];
        this.blockPreview.className += " paragraphpreview";
        var blockArrow = this.buttonNode.appendChild(document.createElement('span'));
        blockArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;

            jpf.popup.setContent(this.uniqueId, this.createPanelBody(editor));
        }
        this.editor.showPopup(this, this.uniqueId, this.buttonNode, 203);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        var oNode    = editor.selection.getSelectedNode();
        var aFormats = getFormats(editor);
        var bCurrent = (oNode && oNode.nodeType == 1 && aFormats.contains(oNode.tagName.toLowerCase()));
        var bParent  = (oNode && oNode.parentNode && oNode.parentNode.nodeType == 1
              && aFormats.contains(oNode.parentNode.tagName.toLowerCase()));
        if (bCurrent || bParent) {
            var sBlock = blocksMap[
                (bParent ? oNode.parentNode.tagName : oNode.tagName).toLowerCase()
            ];
            if (this.blockPreview.innerHTML != sBlock)
                this.blockPreview.innerHTML = sBlock;
            this.state = jpf.editor.ON;
        }
        else {
            this.blockPreview.innerHTML = "Paragraph";
            this.state = jpf.editor.OFF;
        }
        return this.state;
    };

    this.submit = function(e) {
        e = new jpf.AbstractEvent(e || window.event);
        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        var sBlock = e.target.getAttribute('rel');
        if (sBlock) {
            jpf.popup.forceHide();
            var sel = this.editor.selection;

            sel.set();
            this.editor.$visualFocus();

            var s = sel.getContent();
            if (sel.isCollapsed() || s.trim() == "")
                this.editor.executeCommand('FormatBlock', sBlock);
            else
                sel.setContent('<' + sBlock + '>' + s + '</' + sBlock + '>');
        }
    };

    this.createPanelBody = function(editor) {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        panelBody.style.visibility = "hidden";

        var aHtml = [],
            aFormats = getFormats(editor);
        for (var i = 0, j = aFormats.length; i < j; i++) {
            aHtml.push('<a class="editor_panelcell editor_paragraph" rel="',
                aFormats[i], '" href="javascript:;" onmousedown="jpf.lookup(',
                this.uniqueId, ').submit(event);"><', aFormats[i], '>',
                blocksMap[aFormats[i]], '</', aFormats[i], '></a>');
        }
        panelBody.innerHTML = aHtml.join('');

        setTimeout(function() {
            panelBody.style.visibility = "visible";
        });
        return panelBody;
    };
});

// #endif

