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

jpf.editor.plugin('link', function(){
    this.name        = 'link';
    this.icon        = 'link';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+l';
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
        this.editor.showPopup(this, this.uniqueId, this.buttonNode, jpf.isIE6 ? 200 : 193);
        if (panelBody.style.visibility == "hidden")
            panelBody.style.visibility = "visible";
        this.oUrl.focus();
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        if (editor.selection.isCollapsed() || editor.selection.getSelectedNode().tagName == "A")
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
        this.editor.selection.collapse(false);

        e.stop();
        return false;
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        panelBody.style.visibility = "hidden";
        var idUrl    = 'editor_' + this.uniqueId + '_link_url';
        var idTarget = 'editor_' + this.uniqueId + '_link_target';
        var idTitle  = 'editor_' + this.uniqueId + '_link_title';
        var idButton = 'editor_' + this.uniqueId + '_link_button';
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
            <div class="editor_panelrow editor_panelrowinput">\
                <button id="' + idButton + '">Insert</button>\
            </div>';

        document.getElementById(idButton).onmousedown = this.submit.bindWithEvent(this);
        this.oUrl    = document.getElementById(idUrl);
        this.oTarget = document.getElementById(idTarget);
        this.oTitle  = document.getElementById(idTitle);
        jpf.sanitizeTextbox(this.oUrl);
        jpf.sanitizeTextbox(this.oTarget);
        jpf.sanitizeTextbox(this.oTitle);

        setTimeout(function() {
            panelBody.style.visibility = "visible";
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

jpf.editor.plugin('unlink', function(){
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

        var sel = editor.selection;
        sel.set();
        var oNode = sel.getSelectedNode();
        if (oNode.tagName == "A") {
            var txt = oNode.innerHTML;
            sel.selectNode(oNode);
            sel.remove();
            sel.collapse();
            editor.insertHTML(txt);
        }
    };

    this.queryState = function(editor) {
        if (editor.selection.getSelectedNode().tagName == "A")
            return jpf.editor.OFF;

        return jpf.editor.DISABLED;
    };
});

// #endif
