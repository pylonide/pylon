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

// #ifdef __ENABLE_EDITOR_ANCHOR || __INC_ALL

apf.LiveEdit.plugin("anchor", function() {
    this.name        = "anchor";
    this.icon        = "anchor";
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARPANEL;
    this.hook        = "ontoolbar";
    this.keyBinding  = "ctrl+shift+a";
    this.state       = apf.OFF;

    this.editor      = null;

    var panelBody;

    this.init = function(editor, btn) {
        this.editor = editor;
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

        this.editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});

        this.editor.$showPopup(this, this.$uniqueId, this.buttonNode, 218, 47);
        if (panelBody.style.visibility == "hidden")
            panelBody.style.visibility = "visible";
        var _self = this;
        $setTimeout(function() {
            _self.oName.focus();
        });
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function() {
        // @todo: for webkit compat, we need to insert images instead of inline an elements
        var oNode = this.editor.$selection.getSelectedNode();
        if (oNode.tagName == "A" && oNode.getAttribute("name"))
            return apf.ON;

        return this.state;
    };

    this.submit = function(e) {
        apf.popup.forceHide();

        if (!this.oName.value) return;

        //this.storeSelection();
        this.editor.$insertHtml('<a name="' + this.oName.value + '" class="itemAnchor" />');
        //this.restoreSelection();
        this.editor.$selection.collapse(false);
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement("div"));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";
        var idName   = "editor_" + this.$uniqueId + "_anchor_url",
            idButton = "editor_" + this.$uniqueId + "_anchor_button";
        panelBody.innerHTML =
           '<div class="editor_panelrow editor_panelrowinput">\
                <label for="' + idName + '">Anchor name</label>\
                <input type="text" id="' + idName + '" name="' + idName + '" class="editor_input" value="" />\
            </div>\
            <div id="' + idButton + '" class="editor_panelrow editor_panelrowbtns"></div>';

        new apf.toolbar({
            htmlNode: document.getElementById(idButton),
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
        
        this.oName = document.getElementById(idName);
        //#ifdef __WITH_WINDOW_FOCUS
        apf.sanitizeTextbox(this.oName);
        // #endif
        return panelBody;
    };

    this.destroy = function() {
        panelBody = this.editor = this.oName = null;
        delete panelBody;
        delete this.editor;
        delete this.oName;
    };
});

// #endif
