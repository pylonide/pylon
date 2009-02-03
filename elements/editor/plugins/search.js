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

// #ifdef __ENABLE_EDITOR_SEARCH || __INC_ALL

jpf.editor.searchPlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = this.name == "search" ? 'ctrl+f' : 'ctrl+shift+f';
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

        this.editor.showPopup(this, this.uniqueId, this.buttonNode, 218,
            this.name == "search" ? 71 : 95);
        // prefill search box with selected text
        this.oSearch.value = this.editor.selection.getContent();
        var _self = this;
        setTimeout(function() {
            _self.oSearch.focus();
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
        //e = new jpf.AbstractEvent(e || window.event);
        var val = this.oSearch.value, bMatchCase = this.oCase.checked, flag = 0;
        if (!val)
            return;

        if (jpf.isIE)
            this.editor.selection.set();
        //this.editor.oDoc.execCommand('SelectAll');
        //this.editor.executeCommand('SelectAll');
        this.editor.selection.collapse(false);
        this.editor.$visualFocus();

        if (bMatchCase) //IE specific flagging
            flag = flag | 4;

        var found = false;

        if (jpf.isIE) {
            var range = this.editor.selection.getRange();
            if (range.findText(val, 1, flag)) {
                range.scrollIntoView();
                range.select();
                found = true;
            }
            //this.storeSelection();
            this.editor.selection.cache();
        }
        else {
            if (this.editor.oWin.find(val, bMatchCase, false, true, false, false, false))
                found = true;
            //else
            //    fix();
        }
        if (this.oReplBtn)
            this.oReplBtn[!found ? "disable" : "enable"]();

        if (!found) {
            if (this.oReplBtn)
                this.oReplBtn.disable();
            alert("No occurences found for '" + val + "'");
        }
        else if (this.oReplBtn)
            this.oReplBtn.enable();

        if (e.stop)
            e.stop();
        else
            e.cancelBubble = true;

        if (!jpf.isIE) {
            // IE cannot show the selection anywhere else then where the cursor
            // is, so no show for them users...
            var _self = this;
            setTimeout(function() {
                _self.oSearch.focus();
            });
        }

        return false;
    };

    this.onDoReplClick = function(e) {
        if (!this.editor.selection.isCollapsed())
            this.replace();
    };

    this.onReplAllClick = function(e) {
        var val = this.oSearch.value, bMatchCase = this.oCase.checked, flag = 0,
            ed  = this.editor;
        if (!val)
            return;

        // Move caret to beginning of text
        this.editor.executeCommand('SelectAll');
        this.editor.selection.collapse(true);
        this.editor.$visualFocus();

        var range = this.editor.selection.getRange(), found = 0;

        if (bMatchCase) //IE specific flagging
            flag = flag | 4;

        if (jpf.isIE) {
            while (range.findText(val, 1, flag)) {
                range.scrollIntoView();
                range.select();
                this.replace();
                found++;
            }
            this.editor.selection.cache();
            //this.storeSelection();
        }
        else {
            while (this.editor.oWin.find(val, bMatchCase, false, false, false, false, false)) {
                this.replace();
                found++;
            }
        }

        if (found > 0)
            alert(found + " occurences found and replaced with '" + this.oReplace.value + "'");
        else
            alert("No occurences found for '" + val + "'");
    };

    this.replace = function() {
        var sRepl = this.oReplace.value;
        // Needs to be duplicated due to selection bug in IE
        if (jpf.isIE) {
            //this.restoreSelection();
            this.editor.selection.set();
            this.editor.selection.getRange().duplicate().pasteHTML(sRepl);
        }
        else
            this.editor.oDoc.execCommand('InsertHTML', false, sRepl);
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";
        var idSearch     = 'editor_' + this.uniqueId + '_input';
        var idReplace    = 'editor_' + this.uniqueId + '_replace';
        var idReplBtn    = 'editor_' + this.uniqueId + '_replbtn';
        var idReplAllBtn = 'editor_' + this.uniqueId + '_replallbtn';
        var idCase       = 'editor_' + this.uniqueId + '_case';
        var idBtns       = 'editor_' + this.uniqueId + '_btns';
        panelBody.innerHTML =
           '<div class="editor_panelrow editor_panelrowinput">\
                <label for="' + idSearch + '">Find what</label>\
                <input type="text" id="' + idSearch + '" class="editor_input" name="' + idSearch + '" value="" />\
            </div>' +
            (this.name == "replace" ?
           '<div class="editor_panelrow editor_panelrowinput">\
                <label for="' + idReplace + '">Replace with</label>\
                <input type="text" id="' + idReplace + '" class="editor_input" name="' + idReplace + '" value="" />\
            </div>' : '') +
           '<div class="editor_panelrow editor_panelrowinput">\
                <label for="' + idCase + '">Match case</label>\
                <input type="checkbox" id="' + idCase + '" name="' + idCase + '" class="editor_checkbox" value="" />\
            </div>\
            <div id="' + idBtns + '" class="editor_panelrow editor_panelrowbtns"></div>';
        this.oSearch = document.getElementById(idSearch);
        this.oCase   = document.getElementById(idCase);
        
        var aJml = [
            '<j:toolbar xmlns:j="', jpf.ns.jml, '"><j:bar>\
             <j:button caption="Find next"\
               onclick="jpf.lookup(', this.uniqueId, ').submit(event)" />'];
        if (this.name == "replace") {
            this.oReplace = document.getElementById(idReplace);
            aJml.push(
                '<j:button caption="Replace"\
                  onclick="jpf.lookup(', this.uniqueId, ').onDoReplClick(event)"\
                  id="', idReplBtn, '" />\
                <j:button caption="Replace all"\
                  onclick="jpf.lookup(', this.uniqueId, ').onReplAllClick(event)"\
                  id="', idReplAllBtn, '" />');
        }
        aJml.push('</j:bar></j:toolbar>');

        this.appendJmlNode(aJml.join(""), document.getElementById(idBtns));

        if (this.name == "replace") {
            this.oReplBtn    = self[idReplBtn];
            this.oReplAllBtn = self[idReplAllBtn];
            this.oReplBtn.disable();
        }

        //#ifdef __WITH_WINDOW_FOCUS
        if (jpf.hasFocusBug) {
            var fSel = function(e) {
                e = e || window.event;
                e.cancelBubble = true;
            };
            jpf.sanitizeTextbox(this.oSearch);
            this.oSearch.onselectstart = fSel;
            if (this.oReplace) {
                jpf.sanitizeTextbox(this.oReplace);
                this.oReplace.onselectstart = fSel;
            }
            // checkboxes also need the focus fix:
            jpf.sanitizeTextbox(this.oCase);
        }
        //#endif

        return panelBody;
    };

    this.destroy = function() {
        panelBody = this.oSearch = this.oCase = null;
        delete panelBody;
        delete this.oSearch;
        delete this.oCase;
        if (this.oReplace) {
            this.oReplace = this.oReplBtn = this.oReplAllBtn = null;
            delete this.oReplace;
            delete this.oReplBtn;
            delete this.oReplAllBtn;
        }
    };
};

jpf.editor.plugin('search',  jpf.editor.searchPlugin);
jpf.editor.plugin('replace', jpf.editor.searchPlugin);

// #endif
