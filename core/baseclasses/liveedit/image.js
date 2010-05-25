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

apf.LiveEdit.plugin("image", function(){
    this.name        = "image";
    this.icon        = "image";
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARPANEL;
    this.hook        = "ontoolbar";
    this.keyBinding  = "ctrl+alt+i";
    this.state       = apf.OFF;

    var panelBody;

    this.init = function(editor) {
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

        // @todo: auto-fill input with currently selected image url
        this.editor.$showPopup(this, this.$uniqueId, this.buttonNode, 218, 47);
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
        return this.state;
    };

    this.submit = function(e) {
        var sUrl = this.oUrl.value;
        if (sUrl) {
            apf.popup.forceHide();
            var oUrl = new apf.url(sUrl);
            if (!oUrl.protocol || !oUrl.host || !oUrl.file) 
                alert("Please enter a valid URL");
            else
                this.editor.$insertHtml('<img src="' + sUrl + '" border="0" />', true);
        }
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement("div"));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";
        var idUrl  = "editor_" + this.$uniqueId + "_input";
        var idBtns = "editor_" + this.$uniqueId + "_btns";
        panelBody.innerHTML =
           '<div class="editor_panelrow editor_panelrowinput">\
                <label for="' + idUrl + '">Image URL</label>\
                <input type="text" id="' + idUrl + '" class="editor_input" name="' + idUrl + '" value="" />\
            </div>\
            <div id="' + idBtns + '" class="editor_panelrow editor_panelrowbtns"></div>';
        this.oUrl = document.getElementById(idUrl);
        this.appendAmlNode(
            '<a:toolbar xmlns:a="' + apf.ns.aml + '"><a:bar>\
             <a:button caption="Insert"\
               onclick="apf.lookup(' + this.$uniqueId + ').submit(event)" />\
             </a:bar></a:toolbar>',
          document.getElementById(idBtns));

        //#ifdef __WITH_WINDOW_FOCUS
        if (apf.hasFocusBug) {
            apf.sanitizeTextbox(this.oUrl);
            this.oUrl.onselectstart = function(e) {
                e = e || window.event;
                e.cancelBubble = true;
            };
        }
        //#endif

        return panelBody;
    };

    this.destroy = function() {
        panelBody = this.oUrl = null;
        delete panelBody;
        delete this.oUrl;
    };
});

apf.LiveEdit.plugin("imagespecial", function() {
    this.name        = "imagespecial";
    this.icon        = "image";
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARBUTTON;
    this.hook        = "ontoolbar";
    this.keyBinding  = "ctrl+alt+j";
    this.state       = apf.OFF;

    var winHandle;

    this.execute = function(editor) {
        if (!winHandle) {
            // get window handle from editor AML attribute
            var s = (editor.getAttribute("imagewindow") || "").trim();
            if (s)
                winHandle = self[s];
        }

        if (winHandle && winHandle.show)
            winHandle.show();

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});
    };

    this.queryState = function(editor) {
        return this.state;
    };
});

// #endif
