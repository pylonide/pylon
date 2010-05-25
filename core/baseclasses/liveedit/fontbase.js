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

apf.LiveEdit.plugin("fonts", function() {
    this.name        = "fonts";
    this.icon        = "fonts";
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARPANEL;
    this.hook        = "ontoolbar";
    this.buttonNode  = null;
    this.state       = apf.OFF;
    this.colspan     = 1;
    this.fontNames   = {};

    var panelBody;

    this.init = function(editor) {
        this.buttonNode.className = this.buttonNode.className + " fontpicker";
        this.fontPreview = this.buttonNode.getElementsByTagName("span")[0];
        this.fontPreview.className += " fontpreview";
        var fontArrow = this.buttonNode.insertBefore(document.createElement("span"),
            this.buttonNode.getElementsByTagName("div")[0]);
        fontArrow.className = "selectarrow";

        this.editor = editor;

        // parse fonts
        var l, j, font, fonts, node;
        var oNode = editor.$getPluginOption("fonts").childNodes[0];
        while(oNode) {
            fonts = oNode.nodeValue.splitSafe("(?:;|=)");
            if (fonts[0]) {
                for (j = 0, l = fonts.length; j < l; j++)
                    this.fontNames[fonts[j]] = fonts[++j];
                break;
            }
            oNode = oNode.nextSibling
        }

        this.queryState(editor);
    };

    this.execute = function() {
        if (!panelBody)
            apf.popup.setContent(this.$uniqueId, this.createPanelBody());

        this.editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});
        
        this.editor.$showPopup(this, this.$uniqueId, this.buttonNode, 120);
        //return button id, icon and action:

        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        this.state = editor.$queryCommandState("FontName");

        var currValue = editor.$queryCommandValue("FontName");
        if (!currValue || (this.fontNames[currValue] && this.fontPreview.innerHTML != currValue))
            this.fontPreview.innerHTML = currValue ? currValue : "Font";
    };

    this.submit = function(e) {
        var el = e.target || e.srcElement;
        while (el.tagName.toLowerCase() != "a" && el.className != "editor_popup")
            el = el.parentNode;
        var sFont = el.getAttribute("rel");
        if (sFont) {
            apf.popup.forceHide();
            if (apf.isIE) {
                this.editor.$selection.set();
                if (this.editor.$selection.isCollapsed()) {
                    this.editor.$visualFocus();
                    var r = this.editor.$selection.getRange();
                    r.moveStart("character", -1);
                    r.select();
                }
            }
            this.editor.$execCommand("FontName", sFont);
            if (apf.isIE)
                this.editor.$selection.collapse(false);
        }
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement("div"));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";
        var aHtml = [];

        for (var i in this.fontNames) {
            aHtml.push('<a class="editor_panelcell editor_font" style="font-family:',
                this.fontNames[i], ';" rel="', i,
                '" href="javascript:;" onmousedown="apf.lookup(', this.$uniqueId,
                ').submit(event);">', i, "</a>");
        }
        panelBody.innerHTML = aHtml.join("");

        return panelBody;
    };

    this.destroy = function() {
        panelBody = this.fontPreview = null;
        delete panelBody;
        delete this.fontPreview;
    };
});

apf.LiveEdit.plugin("fontsize", function() {
    this.name        = "fontsize";
    this.icon        = "fontsize";
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARPANEL;
    this.hook        = "ontoolbar";
    this.buttonNode  = null;
    this.state       = apf.OFF;

    var panelBody;

    // this hashmap maps font size number to it's equivalent in points (pt)
    var sizeMap = {
        "1" : "8",
        "2" : "10",
        "3" : "12",
        "4" : "14",
        "5" : "18",
        "6" : "24",
        "7" : "36"
    };

    this.init = function(editor) {
        this.buttonNode.className = this.buttonNode.className + " fontsizepicker";
        this.sizePreview = this.buttonNode.getElementsByTagName("span")[0];
        this.sizePreview.className += " fontsizepreview";
        var sizeArrow = this.buttonNode.insertBefore(document.createElement("span"),
            this.buttonNode.getElementsByTagName("div")[0]);
        sizeArrow.className = "selectarrow";

        this.queryState(editor);
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;

            // parse font sizes
            var i, node, oNode = editor.$getPluginOption("fontsizes");
            for (i = 0; i < oNode.childNodes.length; i++) {
                node = oNode.childNodes[i];
                if (node.nodeType == 3 || node.nodeType == 4)
                    this.fontSizes = node.nodeValue.splitSafe(",");
            }

            apf.popup.setContent(this.$uniqueId, this.createPanelBody());
        }
        this.editor.$showPopup(this, this.$uniqueId, this.buttonNode, 203);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        this.state = editor.$queryCommandState("FontSize");

        var currValue = editor.$queryCommandValue("FontSize")
        if (!currValue || this.sizePreview.innerHTML != currValue)
            this.sizePreview.innerHTML = currValue ? currValue : "Size";
    };

    this.submit = function(e) {
        var el = e.target || e.srcElement;
        while (el.tagName.toLowerCase() != "a" && el.className != "editor_popup")
            el = el.parentNode;
        var sSize = el.getAttribute("rel");
        if (sSize) {
            apf.popup.forceHide();
            if (apf.isIE) {
                this.editor.$selection.set();
                if (this.editor.$selection.isCollapsed()) {
                    this.editor.$visualFocus();
                    var r = this.editor.$selection.getRange();
                    r.moveStart("character", -1);
                    r.select();
                }
            }
            this.editor.$execCommand("FontSize", sSize);
            if (apf.isIE)
                this.editor.$selection.collapse(false);
        }
        apf.stopEvent(e);
        return false;
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement("div"));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";
        var aHtml  = [],
            aSizes = this.fontSizes,
            i      = 0,
            l      = aSizes.length;
        for (; i < l; i++) {
            aHtml.push('<a class="editor_panelcell editor_fontsize" style="font-size:',
                sizeMap[aSizes[i]], "pt;height:", sizeMap[aSizes[i]], "pt;line-height:",
                sizeMap[aSizes[i]], 'pt;" rel="', aSizes[i],
                '" href="javascript:;" onmousedown="apf.lookup(', this.$uniqueId,
                ').submit(event);">', aSizes[i], " (", sizeMap[aSizes[i]], "pt)</a>");
        }
        panelBody.innerHTML = aHtml.join("");

        return panelBody;
    };

    this.destroy = function() {
        panelBody = this.sizePreview = null;
        delete panelBody;
        delete this.sizePreview;
    };
});

// #endif
