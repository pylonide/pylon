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

apf.LiveEdit.plugin("fontstyle", function() {
    this.name         = "fontstyle";
    this.icon         = "fontstyle";
    this.type         = apf.TOOLBARITEM;
    this.subType      = apf.TOOLBARPANEL;
    this.hook         = "ontoolbar";
    this.buttonNode   = null;
    this.state        = apf.OFF;

    var panelBody, oStyles = null, oEditor = null;

    function getStyles(editor) {
        if (!oStyles) {
            // parse font styles from skin definition
            var node, aCss, bCss, oNode = editor.$getPluginOption("fontstyles");
            // #ifdef __DEBUG
            if (!oNode || !oNode.childNodes)
                throw new Error(apf.formatErrorString(0, editor,
                    "Initializing plugin: fontstyle",
                    "No fontstyle block found in skin definition"));
            // #endif
            for (var i = 0, j = oNode.childNodes.length; i < j && !oStyles; i++) {
                node = oNode.childNodes[i];
                if (node.nodeType == 3 || node.nodeType == 4) {
                    oStyles = {};
                    aCss    = [];
                    bCss    = [];

                    node.nodeValue.replace(/([\w ]+)\s*=\s*(([^\{]+?)\s*\{[\s\S]*?\})\s*/g,
                        function (m, caption, css, className) {
                            // #ifdef __DEBUG
                            if (!css || css.charAt(css.length - 1) != "}")
                                throw new Error(apf.formatErrorString(0, editor,
                                    "Initializing plugin: fontstyle",
                                    "Invalid fontstyle block, please check if formatting rules have been applied"));
                            // #endif
                            if (css.charAt(0) != ".")
                                css = "." + css;
                            css = css.trim().replace(/[\s]+/g, "");
                            className = className.trim().replace(/\./, "");
                            oStyles[className] = {
                                caption: caption.trim(),
                                cname  : className,
                                css    : css,
                                node   : null
                            };
                            aCss.push(css);
                            bCss.push(".editor_fontstyle " + css);
                        }
                    );
                }
            }

            if (aCss.length) {
                // insert resulting CSS into container document AND inside the
                // document of the editor's iframe
                apf.importCssString(bCss.join(""));
                apf.importCssString(aCss.join(""), editor.$activeDocument);
                if (apf.isIE) {
                    // removing text nodes from the HEAD section, which are added
                    // by IE in some cases.
                    var nodes = editor.$activeDocument.getElementsByTagName("head")[0].childNodes,
                        cnt   = nodes.length - 1;
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
        oEditor = editor;
        
        this.buttonNode.className = this.buttonNode.className + " fontstylepicker";
        this.stylePreview = this.buttonNode.getElementsByTagName("span")[0];
        this.stylePreview.className += " fontstylepreview";
        var styleArrow = this.buttonNode.appendChild(document.createElement("span"));
        styleArrow.className = "selectarrow";

        this.queryState(editor);
    };

    this.execute = function(editor) {
        if (!panelBody) {
            oEditor = editor;

            apf.popup.setContent(this.$uniqueId, this.createPanelBody(editor));
        }

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});

        oEditor.$showPopup(this, this.$uniqueId, this.buttonNode, 203);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    function getCurrentStyle() {
        getStyles(oEditor);

        var oNode = oEditor.$selection.getSelectedNode();
        while (oNode && oNode.nodeType != 1) // we need a block element
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

    this.submit = function(e, sStyle) {
        if (!sStyle) {
            el = e.target || e.srcElement;
            while (el.tagName.toLowerCase() != "a" && el.className != "editor_popup")
                el = el.parentNode;
            sStyle = el.getAttribute("rel");
        }

        if (sStyle) {
            apf.popup.forceHide();
            var sel = oEditor.$selection;

            sel.set();
            oEditor.$visualFocus();
            
            var o = getCurrentStyle(oEditor);
            
            if (o && sStyle == "normal") {
                var n = o.node.childNodes, p = o.node.parentNode;
                while (n.length) {
                    p.insertBefore(n[0], o.node);
                }
                p.removeChild(o.node);
                
                this.queryState(oEditor);
            }
            else if (o && (sel.isCollapsed() 
              || sel.getContent("text") == o.node.innerHTML)
              && apf.isChildOf(o.node, sel.getSelectedNode(), true)) {
                if (o.cname == sStyle) return;
                apf.setStyleClass(o.node, sStyle, [o.cname]);
            }
            else {
                if (sel.isCollapsed()) {
                    if (apf.isIE) {
                        var oNode = sel.getRange().parentElement();
                        var p = oEditor.$activeDocument.createElement("span");
                        p.className = sStyle;
                        p.innerHTML = oNode.innerHTML;
                        if (oNode.tagName == "BODY") {
                            oNode.innerHTML = "";
                            oNode.appendChild(p);
                        }
                        else {
                            oNode.parentNode.insertBefore(p, oNode);
                            oNode.parentNode.removeChild(oNode);
                        }
                        sel.selectNode(p);
                    }
                    else {
                        var range  = sel.getRange();
                        var oCaret = range.commonAncestorContainer;
                        range.setStartBefore(oCaret);
                        range.setEndAfter(oCaret);
                        sel.setRange(range);
                        var htmlNode = sel.setContent('<span class="' + sStyle + '">'
                            + sel.getContent() + "</span>");
                        sel.selectNode(htmlNode);
                    }
                }
                else {
                    //s.match(/^([\s\S]*?)(<(?:normal|pre|p|address|h1|h2|h3|h4|h5|h6)[\s\S]*?<\/(?:normal|pre|p|address|h1|h2|h3|h4|h5|h6)>)([\s\S]*?)$/gi)
                    var s = sel.getContent().trim();
                    var shouldPrefixSpan = s.substr(0,5) == "<SPAN";
                    s = s.replace(/<SPAN class=.*?>|<\/SPAN>/gi, "");
                    if (s.charAt(0) == "<") {
                        s = s
                          .replace(/<(normal|pre|p|address|h1|h2|h3|h4|h5|h6)(?:\s.*?|)>(.+?)<\/(normal|pre|p|address|h1|h2|h3|h4|h5|h6)>/gi, 
                            '<$1><span class="' + sStyle + '">$2</span></$3>')
                          .replace(/^([\s\S]*?)(<(?:normal|pre|p|address|h1|h2|h3|h4|h5|h6)[\s\S]*<\/(?:normal|pre|p|address|h1|h2|h3|h4|h5|h6)>)([\s\S]*?)$/gi, 
                            function(m, m1, m2, m3){
                                return (m1 ? '<span class="' + sStyle + '">' + m1 + "</span>" : "") + m2 + (m3 ? '<span class="' + sStyle + '">' + m3 + "</span>" : "");
                            })
                          .replace(/^\s*<(?:normal|pre|p|address|h1|h2|h3|h4|h5|h6)(?:\s.*?|)>|<\/(?:normal|pre|p|address|h1|h2|h3|h4|h5|h6)>\s*$/gi, "");
                        if (apf.isIE) 
                            s = s.replace(/<\/P>/, "");
                    }
                    else {
                        s = '<span class="' + sStyle + '">' + s + "</span>";
                    }
                    
                    if (shouldPrefixSpan) 
                        s = "</SPAN>" + s.replace(/<\/SPAN>$/i, "");
                    
                    var htmlNode = sel.setContent(s, true);
                    sel.selectNode(htmlNode);
                }
            }

            oEditor.$restoreFocus();
            // Notify the SmartBindings we've changed...
            // #ifdef __WITH_DATAACTION
            oEditor.change(oEditor.getValue());
            /* #else
            oEditor.setProperty("value", oEditor.getValue())
            #endif*/
        }
    };

    this.queryState = function() {
        var o = getCurrentStyle();
        if (o) {
            if (this.stylePreview.innerHTML != o.caption)
                this.stylePreview.innerHTML = o.caption;
            this.state = apf.ON;
        }
        else {
            this.stylePreview.innerHTML = "Style";
            this.state = apf.OFF;
        }

        return this.state;
    };

    this.createPanelBody = function(editor) {
        panelBody = document.body.appendChild(document.createElement("div"));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";

        getStyles(editor);
        var aHtml = ['<a class="editor_panelcell editor_fontstyle" rel="normal" \
            href="javascript:;" onmouseup="apf.lookup(', this.$uniqueId, 
            ').submit(event);"><span>Normal</span></a>'];
        for (var i in oStyles) {
            aHtml.push('<a class="editor_panelcell editor_fontstyle" rel="',
                i, '" href="javascript:;" onmousedown="apf.lookup(',
                this.$uniqueId, ').submit(event);"><span class="', i, '">',
                oStyles[i].caption, "</span></a>")
        }
        panelBody.innerHTML = aHtml.join("");

        return panelBody;
    };

    this.destroy = function() {
        panelBody = this.stylePreview = oEditor = null;
        delete panelBody;
        delete this.stylePreview;
        delete oEditor;
    };
});

//##############################################################################

apf.LiveEdit.plugin("blockformat", function() {
    this.name         = "blockformat";
    this.icon         = "blockformat";
    this.type         = apf.TOOLBARITEM;
    this.subType      = apf.TOOLBARPANEL;
    this.hook         = "ontoolbar";
    this.buttonNode   = null;
    this.state        = apf.OFF;
    this.node         = null;

    var panelBody, oEditor,

    // this hashmap maps font size number to it's equivalent in points (pt)
    blocksMap = {
        "normal"  : "Normal",
        "p"       : "Paragraph",
        "pre"     : "Preformatted",
        "address" : "Address",
        "h1"      : "Header 1",
        "h2"      : "Header 2",
        "h3"      : "Header 3",
        "h4"      : "Header 4",
        "h5"      : "Header 5",
        "h6"      : "Header 6"
    },
    blocksRE, blocksRE2, blocksRE3, blocksRE4, blockFormats;

    function getFormats(editor) {
        if (!blockFormats) {
            // parse font styles from skin definition
            var i, j, node, oNode = editor.$getPluginOption("blockformats");
            // #ifdef __DEBUG
            if (!oNode || !oNode.childNodes)
                throw new Error(apf.formatErrorString(0, editor,
                    "Initializing plugin: Blockformat",
                    "No block formats found in skin definition"));
            // #endif
            for (i = 0, j = oNode.childNodes.length; i < j; i++) {
                node = oNode.childNodes[i];
                if (node.nodeType == 3 || node.nodeType == 4)
                    blockFormats = node.nodeValue.splitSafe(",");
            }

            var sJoin = "(" + blockFormats.join("|") + ")";
            blocksRE  = new RegExp("^" + sJoin + "$", "gi");
            blocksRE2 = new RegExp("<\\/?" + sJoin + ">", "gi");
            blocksRE3 = new RegExp("<\\/?(" + blockFormats.join("|") + "|p)>", "gi");
            blocksRE4 = new RegExp("^(" + blockFormats.join("|") + "|p)$", "gi");
        }
        return blockFormats;
    }

    this.init = function(editor) {
        oEditor = editor;
        this.buttonNode.className = this.buttonNode.className + " blockformatpicker";
        this.blockPreview = this.buttonNode.getElementsByTagName("span")[0];
        this.blockPreview.className += " blockformatpreview";
        var blockArrow = this.buttonNode.appendChild(document.createElement("span"));
        blockArrow.className = "selectarrow";

        this.queryState(editor);
    };

    this.execute = function(editor) {
        if (!panelBody) {
            oEditor = editor;

            apf.popup.setContent(this.$uniqueId, this.createPanelBody(editor));
        }
        oEditor.$showPopup(this, this.$uniqueId, this.buttonNode, 203);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };
    
    this.queryState = function() {
        var oNode    = oEditor.$selection.getSelectedNode(),
            aFormats = getFormats(oEditor),
            /*bCurrent = (oNode && oNode.nodeType == 1
                && aFormats.contains(oNode.tagName.toLowerCase())),
            bParent  = (oNode && oNode.parentNode && oNode.parentNode.nodeType == 1
                && aFormats.contains(oNode.parentNode.tagName.toLowerCase())),*/
            tagName  = oNode.nodeType == 1 ? oNode.tagName.toLowerCase() : "";
        
        while (tagName && !tagName.match(blocksRE) && tagName != "body") {
            oNode   = oNode.parentNode;
            tagName = (oNode.tagName || "").toLowerCase();
        }
        if (tagName.match(blocksRE)) {//bCurrent || bParent) {
            var sBlock = blocksMap[tagName];
            if (this.blockPreview.innerHTML != sBlock)
                this.blockPreview.innerHTML = sBlock;
            this.state = apf.ON;
            this.node  = oNode;
        }
        else {
            this.blockPreview.innerHTML = "Normal";
            this.state = apf.OFF;
            this.node  = null;
        }
        return this.state;
    };

    this.submit = function(e, sBlock) {
        if (!sBlock) {
            var el = e.target || e.srcElement;
            while (el.tagName.toLowerCase() != "a" && el.className != "editor_popup")
                el = el.parentNode;
            sBlock = el.getAttribute("rel");
        }

        if (sBlock) {
            apf.popup.forceHide();
            var oNode, sel = oEditor.$selection;

            sel.set();
            oEditor.$visualFocus();
            var s = sel.getContent();
            if (sBlock == "normal" && this.queryState(oEditor) == apf.ON) {
                // revert style to NORMAL, i.e. no style at all.
                /*sel.selectNode(this.node);
                sel.setContent(this.node.innerHTML);*/
                
                var n = this.node.childNodes, p = this.node.parentNode;
                
                if (apf.isIE) {
                    //var textlength = sel.getContent("text").length;
                    var l = p.insertBefore(p.ownerDocument.createElement("p"), this.node);
                    
                    while (n.length) {
                        l.insertBefore(n[0], l.firstChild);
                    }
                    
                    p.removeChild(this.node);
                    sel.selectNode(l);
                    if (l.previousSibling && l.previousSibling.tagName == "P") {
                        if (l.previousSibling.innerHTML == "") {
                            l.parentNode.removeChild(l.previousSibling);
                        }
                    }
                }
                else {
                    while (n.length) {
                        p.insertBefore(n[0], this.node);
                    }
                    
                    p.removeChild(this.node);
                }
                
                this.state = apf.OFF;
                this.node  = null;
                this.blockPreview.innerHTML = "Normal";
            }
            else if (sel.isCollapsed() || s.trim() == "") {
                if (apf.isIE) {
                    var startNode, oNode;
                    oNode = startNode = sel.getRange().parentElement();
                    while(!oNode.tagName.match(blocksRE4) && oNode.tagName != "BODY") {
                        oNode = oNode.parentNode;
                    }
                    
                    if (oNode && oNode.tagName == "BODY") {
                        if (startNode != oNode)
                            oNode = startNode;
                        else  {
                            //r = sel.getRange();r.moveEnd("character", 500); r.htmlText
                        }
                    }
                    
                    var p = oEditor.$activeDocument.createElement(sBlock);
                    p.innerHTML = oNode.innerHTML;
                    if (oNode.tagName == "BODY") {
                        oNode.innerHTML = "";
                        oNode.appendChild(p);
                    }
                    else {
                        oNode.parentNode.insertBefore(p, oNode);
                        oNode.parentNode.removeChild(oNode);
                    }
                    sel.selectNode(p);
                }
                else {
                    oEditor.$execCommand("FormatBlock", sBlock);
                }
                
                this.blockPreview.innerHTML = blocksMap[sBlock];
            }
            else {
                oNode = sel.getSelectedNode();
                while (oNode.nodeType != 1)
                    oNode = oNode.parentNode;

                // @todo FF is DEFINITELY b0rking when we try to nest HTML 4.01 block elements...
                //       REALLY not like Word does it...
                if (oNode.tagName.match(blocksRE4) && s.length == oNode[apf.hasInnerText ? "innerText" : "textContent"].length) {
                    var p = oEditor.$activeDocument.createElement(sBlock);
                    p.innerHTML = oNode.innerHTML;
                    oNode.parentNode.insertBefore(p, oNode);
                    oNode.parentNode.removeChild(oNode);
                    sel.selectNode(p);
                }
                else {
                    while(!oNode.tagName.match(blocksRE4) && oNode.tagName != "BODY") {
                        oNode = oNode.parentNode;
                    }
                    if (oNode && oNode.tagName != "BODY") {
                        var s2;
                        if (oNode.tagName == "P" && apf.isIE) {
                            s2 = "<" + sBlock + ">" + s.trim().replace(blocksRE3, "") + "</" + sBlock + ">";
                            addedNode = sel.setContent(s2);
                        }
                        else {
                            s2 = '<P __apf_placeholder="true">' + s + "</P>";
                            sel.setContent(s2);
                            
                            var sBlock2 = oNode.tagName;
                            var html = [], first, last;
                            var strHtml = oNode.innerHTML.replace(s2, function(m, pos){
                                return (pos != 0 
                                        ? (first = true) && "</" + sBlock2 + ">"
                                        : "") +
                                    "<" + sBlock + ' __apf_placeholder="true">' + s.replace(blocksRE3, "") +
                                    "</" + sBlock + ">" +
                                    (pos < oNode.innerHTML.length - s.length 
                                        ? (last = true) && "<" + sBlock2 + ">"
                                        : "");
                            });
                            if (first)
                                html.push("<" + sBlock2 + ">");
                            html.push(strHtml);
                            if (last)
                                html.push("</" + sBlock2 + ">");
                            
                            oNode.innerHTML = html.join("");
                            var addedNode, n = oNode.getElementsByTagName(sBlock);
                            for (var i = 0; i < n.length; i++) {
                                if (n[i].getAttribute("__apf_placeholder")) {
                                    n[i].removeAttribute("__apf_placeholder");
                                    addedNode = n[i];
                                    break;
                                }
                            }
                            
                            n = oNode.childNodes, p = oNode.parentNode;
                            while (n.length)
                                p.insertBefore(n[0], oNode);
                            p.removeChild(oNode);
                        }
                        
                        if (addedNode) {
                            if (apf.isIE) {
                                var prev = addedNode.previousSibling
                                if (prev && prev.tagName == "P" && prev.innerHTML == "&nbsp;")
                                    prev.parentNode.removeChild(prev);
                                
                                //@todo make this a setting?
                                /*addedNode.parentNode.insertBefore(
                                    addedNode.ownerDocument.createElement("P"),
                                    addedNode);*/
                            }
                            sel.selectNode(addedNode);
                        }
                    }
                    else {
                        var addedNode = sel.setContent("<" + sBlock + ">"
                            + s.replace(/<p>(.*?)<\/p>(.)/gi, "$1<br />$2")
                               .replace(blocksRE3, "") + "</" + sBlock + ">");
                       
                        if (apf.isIE) {
                            var prev = addedNode.previousSibling
                            if (prev && prev.tagName == "P" && prev.innerHTML == "&nbsp;")
                                prev.parentNode.removeChild(prev);
                                    
                            //@todo make this a setting?
                                /*addedNode.parentNode.insertBefore(
                                addedNode.ownerDocument.createElement("P"),
                                addedNode);*/
                        }
                       
                        sel.selectNode(addedNode);
                    }
                }
                
                this.blockPreview.innerHTML = blocksMap[sBlock];
            }

            oEditor.$restoreFocus();
            // Notify the SmartBindings we've changed...
            // #ifdef __WITH_DATAACTION
            oEditor.change(oEditor.getValue());
            /* #else
            oEditor.setProperty("value", oEditor.getValue())
            #endif*/
        }
    };

    this.createPanelBody = function(editor) {
        panelBody = document.body.appendChild(document.createElement("div"));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";

        var aHtml = [],
            aFormats = getFormats(editor);
        for (var i = 0, j = aFormats.length; i < j; i++) {
            aHtml.push('<a class="editor_panelcell editor_blockformat" rel="',
                aFormats[i], '" href="javascript:;" onmousedown="apf.lookup(',
                this.$uniqueId, ').submit(event);"><', aFormats[i], ">",
                blocksMap[aFormats[i]], "</", aFormats[i], "></a>");
        }
        panelBody.innerHTML = aHtml.join("");

        return panelBody;
    };

    this.destroy = function() {
        panelBody = oEditor = this.blockPreview = this.node = null;
        delete panelBody;
        delete oEditor;
        delete this.blockPreview;
        delete this.node;
    };
});

// #endif

