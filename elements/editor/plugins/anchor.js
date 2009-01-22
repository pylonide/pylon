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

jpf.editor.plugin('anchor', function() {
    this.name        = 'anchor';
    this.icon        = 'anchor';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+a';
    this.state       = jpf.editor.OFF;

    var panelBody;

    this.init = function(editor, btn) {
        this.buttonNode.className = this.buttonNode.className + " dropdown_small";
        var oArrow = this.buttonNode.insertBefore(document.createElement('span'),
            this.buttonNode.getElementsByTagName("div")[0]);
        oArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            jpf.popup.setContent(this.uniqueId, this.createPanelBody());
        }

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});

        this.editor.showPopup(this, this.uniqueId, this.buttonNode, 215, 56);
        if (panelBody.style.visibility == "hidden")
            panelBody.style.visibility = "visible";
        this.oName.focus();
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        // @todo: for webkit compat, we need to insert images instead of inline an elements
        var oNode = editor.selection.getSelectedNode();
        if (oNode.tagName == "A" && oNode.getAttribute('name'))
            return jpf.editor.ON;

        return this.state;
    };

    this.submit = function(e) {
        jpf.popup.forceHide();

        if (!this.oName.value) return;

        //this.storeSelection();
        this.editor.insertHTML('<a name="' + this.oName.value + '" class="itemAnchor" />');
        //this.restoreSelection();
        this.editor.selection.collapse(false);
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        panelBody.style.visibility = "hidden";
        var idName   = 'editor_' + this.uniqueId + '_anchor_url';
        var idButton = 'editor_' + this.uniqueId + '_anchor_button';
        panelBody.innerHTML =
           '<div class="editor_panelrow editor_panelrowinput">\
                <label for="' + idName + '">Anchor name</label>\
                <input type="text" id="' + idName + '" name="' + idName + '" class="editor_input" value="" />\
            </div>\
            <div id="' + idButton + '" class="editor_panelrow editor_panelrowbtns"></div>';

        this.appendJmlNode('<j:button  xmlns:j="' + jpf.ns.jml + '" \
            caption="Insert" bottom="0" right="6" \
            onclick="jpf.lookup(' + this.uniqueId + ').submit(event)" />',
            document.getElementById(idButton));
        this.oName = document.getElementById(idName);
        jpf.sanitizeTextbox(this.oName);

        setTimeout(function() {
            panelBody.style.visibility = "visible";
        });

        return panelBody;
    };

    this.destroy = function() {
        panelBody = this.oName = null;
        delete panelBody;
        delete this.oName;
    };
});

// #endif
