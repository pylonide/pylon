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

// #ifdef __ENABLE_EDITOR_EMOTIONS || __INC_ALL

apf.LiveEdit.plugin("emotions", function() {
    this.name        = "emotions";
    this.icon        = "emotions";
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARPANEL;
    this.hook        = "ontoolbar";
    this.buttonNode  = null;
    this.state       = apf.OFF;
    this.colspan     = 4;
    this.emotions    = [];

    var panelBody;

    this.init = function(editor, btn) {
        this.buttonNode.className = this.buttonNode.className + " dropdown_small";
        var oArrow = this.buttonNode.insertBefore(document.createElement("span"),
            this.buttonNode.getElementsByTagName("div")[0]);
        oArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor       = editor;

            // parse smiley images, or 'emotions'
            var node,
                oNode = editor.$getPluginOption("emotions"),
                i     = 0,
                l     = oNode.childNodes.length;
            for (; i < l; i++) {
                node = oNode.childNodes[i];
                if (node.nodeType == 3 || node.nodeType == 4)
                    this.emotions = node.nodeValue.splitSafe(",");
            }
            this.emotionsPath = oNode.getAttribute("path") || "";

            apf.popup.setContent(this.$uniqueId, this.createPanelBody());
        }

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});

        this.editor.$showPopup(this, this.$uniqueId, this.buttonNode, 123, 110);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function() {
        return this.state;
    };

    this.submit = function(e) {
        var el = e.target || e.srcElement;
        this.editor.$visualFocus();
        var icon = el.getAttribute("rel");
        // @todo still iffy...
        if (!icon || icon == null)
            icon = el.parentNode.getAttribute("rel");
        if (!icon) return;
        apf.popup.forceHide();
        this.editor.$insertHtml('<img src="' + this.emotionsPath
            + "/smiley-" + icon + ".gif" + '" alt="" border="0" />', true);
        //this.restoreSelection();
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement("div"));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";
        var aHtml    = [],
            emotions = this.emotions,
            path     = this.emotionsPath,
            rowLen   = this.colspan - 1,
            i        = 0,
            l        = emotions.length;
        for (; i < l; i++) {
            if (i % this.colspan == 0)
                aHtml.push('<div class="editor_panelrow">');
            aHtml.push('<a class="editor_panelcell editor_largestcell" rel="',
                emotions[i], '" href="javascript:;" onmousedown="apf.lookup(',
                this.$uniqueId, ').submit(event);"><img border="0" src="', path,
                "/smiley-", emotions[i], '.gif" /></a>');
            if (i % this.colspan == rowLen)
                aHtml.push("</div>");
        }
        panelBody.innerHTML = aHtml.join("");

        return panelBody;
    };

    this.destroy = function() {
        panelBody = null;
        delete panelBody;
    };
});

// #endif
