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

// #ifdef __ENABLE_EDITOR_IMAGE || __INC_ALL

jpf.editor.plugin('image', function(){
    this.name        = 'image';
    this.icon        = 'image';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+alt+i';
    this.state       = jpf.editor.OFF;

    var panelBody;

    this.init = function(editor) {
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
        // @todo: auto-fill input with currently selected image url
        this.editor.showPopup(this, this.uniqueId, this.buttonNode, 200, 58);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        return this.state;
    };

    this.submit = function(e) {
        e = new jpf.AbstractEvent(e || window.event);
        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        var sUrl = this.oUrl.value;
        //@todo: more url validation!
        if (sUrl) {
            jpf.popup.forceHide();
            this.editor.insertHTML('</img src="' + Url + '" border="0" />');
        }
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        panelBody.style.visibility = "hidden";
        var idUrl  = 'editor_' + this.uniqueId + '_input';
        var idBtns = 'editor_' + this.uniqueId + '_btns';
        panelBody.innerHTML =
           '<div class="editor_panelrow editor_panelrowinput">\
                <label for="' + idUrl + '">Image URL</label>\
                <input type="text" id="' + idUrl + '" class="editor_input" name="' + idUrl + '" value="" />\
            </div>\
            <div id="' + idBtns + '" class="editor_panelrow editor_panelrowbtns"></div>';
        this.oUrl = document.getElementById(idUrl);
        var oBtns = document.getElementById(idBtns);
        this.appendJmlNode('<j:button  xmlns:j="' + jpf.ns.jml
            + '" caption="Insert" bottom="0" right="6" onclick="jpf.lookup('
            + this.uniqueId + ').submit(event)" />', oBtns);

        //#ifdef __WITH_WINDOW_FOCUS
        if (jpf.hasFocusBug)
            jpf.sanitizeTextbox(this.oUrl);
        //#endif

        setTimeout(function() {
            panelBody.style.visibility = "visible";
        });
        return panelBody;
    };
});

jpf.editor.plugin('imagespecial', function() {
    this.name        = 'imagespecial';
    this.icon        = 'imagespecial';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+alt+j';
    this.state       = jpf.editor.OFF;

    var winHandle;

    this.execute = function(editor) {
        if (!winHandle) {
            // get window handle from editor JML attribute
            var s = (editor.$jml.getAttribute('imagewindow') || "").trim();
            if (s)
                winHandle = eval(s);
        }

        if (winHandle && winHandle.show)
            winHandle.show();
    };

    this.queryState = function(editor) {
        return this.state;
    };
});

// #endif
