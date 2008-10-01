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

jpf.editor.Plugin('anchor', function() {
    this.name        = 'anchor';
    this.icon        = 'anchor';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+a';
    this.state       = jpf.editor.OFF;
    
    var panelBody;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            jpf.popup.setContent(this.uniqueId, this.createPanelBody());
        }
        this.editor.showPopup(this, this.uniqueId, this.buttonNode, 215, 72);
        this.oName.focus();
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };
    
    this.queryState = function(editor) {
        // @todo: for webkit compat, we need to insert images instead of inline a elements
        var oNode = editor.Selection.getSelectedNode();
        if (oNode.tagName == "A" && oNode.getAttribute('name'))
            return jpf.editor.ON;

        return this.state;
    };
    
    this.submit = function(e) {
        jpf.popup.forceHide();
        
        if (!this.oName.value) return;

        this.storeSelection();
        this.editor.insertHTML('<a name="' + this.oName.value + '" class="itemAnchor" />');
        this.restoreSelection();
        this.editor.Selection.collapse(false);
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var idName   = 'editor_' + this.editor.uniqueId + '_anchor_url';
        var idButton = 'editor_' + this.editor.uniqueId + '_anchor_button';
        panelBody.innerHTML = [
           '<span class="editor_panelfirst"><a href="javascript:jpf.popup.forceHide();">x</a></span>\
            <div class="editor_panelrow editor_panelrowinput">\
                <label for="', idName, '">Anchor name</label>\
                <input type="text" id="', idName, '" name="', idName, '" class="editor_input" value="" />\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <button id="', idButton, '">Insert</button>\
            </div>'
        ].join('');

        document.getElementById(idButton).onclick = this.submit.bindWithEvent(this);
        this.oName = document.getElementById(idName);
        return panelBody;
    };
});

// #endif
