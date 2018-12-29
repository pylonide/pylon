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

// #ifdef __ENABLE_EDITOR_LINKS || __INC_ALL

apf.LiveEdit.plugin("link", function(){
    this.name        = "link";
    this.icon        = "link";
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARPANEL;
    this.hook        = "ontoolbar";
    this.keyBinding  = "ctrl+shift+l";
    this.state       = apf.OFF;

    var panelBody;

    this.init = function(editor, btn) {
        this.buttonNode.className = this.buttonNode.className + " dropdown_small";
        var oArrow = this.buttonNode.insertBefore(document.createElement("span"),
            this.buttonNode.getElementsByTagName("div")[0]);
        oArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            apf.popup.setContent(this.$uniqueId, this.createPanelBody());
        }

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});

        this.oUrl.value = "http://";
        this.editor.$showPopup(this, this.$uniqueId, this.buttonNode, 218, 95);
        if (panelBody.style.visibility == "hidden")
            panelBody.style.visibility = "visible";
        var _self = this;
        $setTimeout(function() {
            _self.oUrl.focus();
        });
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        if (editor.$selection.isCollapsed() || editor.$selection.getSelectedNode().tagName == "A")
            return apf.DISABLED;
        return this.state;
    };

    this.submit = function(e) {
        apf.popup.forceHide();

        if (!this.oUrl.value.replace("http://", "")) return;

        this.editor.$execCommand("CreateLink", "javascript:apftmp(0);");
        var oLink,
            oEditor = this.editor,
            aLinks  = oEditor.$activeDocument.getElementsByTagName("a"),
            i       = 0,
            l       = aLinks.length;
        for (; i < l && !oLink; i++)
            if (aLinks[i].href == "javascript:apftmp(0);")
                oLink = aLinks[i];
        if (oLink) {
            var val = this.oUrl.value;
            oLink.href   = (!val.match(/^[a-zA-Z]+\:/) ? "http://" : "") + val;
            oLink.target = this.oTarget.value;
            oLink.title  = this.oTitle.value;
        }
        oEditor.$selection.collapse(false);

        oEditor.$restoreFocus();
        
        // propagate the change AFTER changing back the link to its proper format
        oEditor.change(oEditor.getValue());

        apf.stopEvent(e);
        return false;
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement("div"));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";
        var idUrl    = "editor_" + this.$uniqueId + "_link_url";
        var idTarget = "editor_" + this.$uniqueId + "_link_target";
        var idTitle  = "editor_" + this.$uniqueId + "_link_title";
        var idBtns   = "editor_" + this.$uniqueId + "_link_btns";
        panelBody.innerHTML =
           '<div class="editor_panelrow editor_panelrowinput">\
                <label for="' + idUrl + '">Link URL</label>\
                <input type="text" id="' + idUrl + '" name="' + idUrl + '" class="editor_input" value="" />\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <label for="' + idTarget + '">Target</label>\
                <select id="' + idTarget + '" name="' + idTarget + '">\
                    <option value="_self">Open in this window/ frame</option>\
                    <option value="_blank">Open in new window (_blank)</option>\
                    <option value="_parent">Open in parent window/ frame (_parent)</option>\
                    <option value="_top">Open in top frame (replaces all frames) (_top)</option>\
                </select>\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <label for="' + idTitle + '">Title</label>\
                <input type="text" id="' + idTitle + '" name="' + idTitle + '" class="editor_input" value="" />\
            </div>\
            <div id="' + idBtns + '" class="editor_panelrow editor_panelrowbtns"></div>';

        this.oUrl    = document.getElementById(idUrl);
        this.oTarget = document.getElementById(idTarget);
        this.oTitle  = document.getElementById(idTitle);

        //#ifdef __WITH_WINDOW_FOCUS
        if (apf.hasFocusBug) {
            apf.sanitizeTextbox(this.oUrl);
            apf.sanitizeTextbox(this.oTarget);
            apf.sanitizeTextbox(this.oTitle);
            this.oUrl.onselectstart   = this.oTarget.onselectstart =
            this.oTitle.onselectstart = function(e) {
                e = e || window.event;
                e.cancelBubble = true;
            };
        }
        //#endif

        new apf.toolbar({
            htmlNode: document.getElementById(idBtns),
            skinset: apf.getInheritedAttribute(this.editor.parentNode, "skinset"),
            childNodes: [
                new apf.bar({
                    childNodes: [new apf.button({
                        caption: this.editor.$translate("insert"),
                        onclick: "apf.lookup(" + this.$uniqueId + ").submit(event)"
                    })]
                })
            ]
        });

        return panelBody;
    };

    this.destroy = function() {
        panelBody = this.oUrl = this.oTarget = this.oTitle = null;
        delete panelBody;
        delete this.oUrl;
        delete this.oTarget;
        delete this.oTitle;
    };
});

apf.LiveEdit.plugin("unlink", function(){
    this.name        = "unlink";
    this.icon        = "unlink";
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARBUTTON;
    this.hook        = "ontoolbar";
    this.keyBinding  = "ctrl+shift+l";
    this.state       = apf.OFF;

    this.execute = function(editor) {
        if (this.queryState(editor) == apf.DISABLED)
            return;

        if (apf.isIE) {
            editor.$execCommand("Unlink");
        }
        else {
            var sel = editor.$selection;
            sel.set();
            var oNode = sel.getSelectedNode();
            if (oNode.tagName == "A") {
                var txt = oNode.innerHTML;
                sel.selectNode(oNode);
                sel.remove();
                sel.collapse();
                editor.$insertHtml(txt);
            }
        }
    };

    this.queryState = function(editor) {
        //if (!editor.$selection)
        //    console.dir(editor);
        if (editor.$selection.getSelectedNode().tagName == "A")
            return apf.OFF;

        return apf.DISABLED;
    };
});

// #endif
