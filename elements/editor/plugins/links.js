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

jpf.editor.Plugin('link', function(){
    this.name        = 'link';
    this.icon        = 'link';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+l';
    this.state       = jpf.editor.OFF;
    
    var panelBody;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            jpf.popup.setContent(this.uniqueId, this.createPanelBody());
        }
        this.editor.showPopup(this, this.uniqueId, this.buttonNode, jpf.isIE6 ? 200 : 193);
        this.oUrl.focus();
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        if (editor.Selection.isCollapsed() || editor.Selection.getSelectedNode().tagName == "A")
            return jpf.editor.DISABLED;
        return this.state;
    };

    this.submit = function(e) {
        jpf.popup.forceHide();
        
        if (!this.oUrl.value) return;
        
        this.editor.executeCommand('CreateLink', 'javascript:jpftmp(0);');
        var oLink, aLinks = this.editor.oDoc.getElementsByTagName('a');
        for (var i = 0; i < aLinks.length && !oLink; i++)
            if (aLinks[i].href == 'javascript:jpftmp(0);')
                oLink = aLinks[i];
        if (oLink) {
            oLink.href   = this.oUrl.value;
            oLink.target = this.oTarget.value;
            oLink.title  = this.oTitle.value;
        }
        this.editor.Selection.collapse(false);
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var idUrl    = 'editor_' + this.editor.uniqueId + '_link_url';
        var idTarget = 'editor_' + this.editor.uniqueId + '_link_target';
        var idTitle  = 'editor_' + this.editor.uniqueId + '_link_title';
        var idButton = 'editor_' + this.editor.uniqueId + '_link_button';
        panelBody.innerHTML = [
           '<span class="editor_panelfirst"><a href="javascript:jpf.popup.forceHide();">x</a></span>\
            <div class="editor_panelrow editor_panelrowinput">\
                <label for="', idUrl, '">Link URL</label>\
                <input type="text" id="', idUrl, '" name="', idUrl, '" class="editor_input" value="" />\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <label for="', idTarget, '">Target</label>\
                <select id="', idTarget, '" name="', idTarget, '">\
                    <option value="_self">Open in this window/ frame</option>\
                    <option value="_blank">Open in new window (_blank)</option>\
                    <option value="_parent">Open in parent window/ frame (_parent)</option>\
                    <option value="_top">Open in top frame (replaces all frames) (_top)</option>\
                </select>\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <label for="', idTitle, '">Title</label>\
                <input type="text" id="', idTitle, '" name="', idTitle, '" class="editor_input" value="" />\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <button id="', idButton, '">Insert</button>\
            </div>'
        ].join('');

        document.getElementById(idButton).onmousedown = this.submit.bindWithEvent(this);
        this.oUrl    = document.getElementById(idUrl);
        this.oTarget = document.getElementById(idTarget);
        this.oTitle  = document.getElementById(idTitle);
        return panelBody;
    };
});

jpf.editor.Plugin('unlink', function(){
    this.name        = 'unlink';
    this.icon        = 'unlink';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+l';
    this.state       = jpf.editor.OFF;

    this.execute = function(editor) {
        if (this.queryState(editor) == jpf.editor.DISABLED)
            return;
        
        var oNode = editor.Selection.getSelectedNode();
        if (oNode.tagName == "A") {
            var txt = oNode.innerHTML;
            editor.Selection.selectNode(oNode);
            editor.Selection.remove();
            editor.Selection.collapse();
            editor.insertHTML(txt);
        }
    };
    
    this.queryState = function(editor) {
        if (editor.Selection.getSelectedNode().tagName == "A")
            return jpf.editor.OFF;

        return jpf.editor.DISABLED;
    };
});

// #endif
