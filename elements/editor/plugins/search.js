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

        this.editor.showPopup(this, this.uniqueId, this.buttonNode, this.name == "search" ? 200 : 260, this.name == "search" ? 72 : 93);
        // prefill search box with selected text
        this.oSearch.value = this.editor.Selection.getContent();
        this.oSearch.focus();
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
        var val = this.oSearch.value, bMatchCase = this.oCase.checked, flag = 0;
        if (!val)
            return;

        this.editor.Selection.collapse(false);

        if (bMatchCase) //IE specific flagging
            flag = flag | 4;

        var found = false;

        if (jpf.isIE) {
            var range = this.editor.Selection.getRange();
            if (range.findText(val, 1, flag)) {
                range.scrollIntoView();
                range.select();
                found = true;
            }
            this.storeSelection();
        }
        else {
            if (this.editor.oWin.find(val, bMatchCase, false, true, false, false, false))
                found = true;
            //else
            //    fix();
        }
        if (this.oReplBtn)
            this.oReplBtn.disabled = !found;
        if (!found)
            alert("No occurences found for '" + val + "'");

        e.stop();
        return false;
    };

    function onDoReplClick(e) {
        if (!this.editor.Selection.isCollapsed())
            this.replace();
    }

    function onReplAllClick(e) {
        var val = this.oSearch.value, bMatchCase = this.oCase.checked, flag = 0;
        // Move caret to beginning of text
        this.editor.executeCommand('SelectAll');
        this.editor.Selection.collapse(true);

        var range = this.editor.Selection.getRange(), found = 0;

        if (bMatchCase) //IE specific flagging
            flag = flag | 4;

        if (jpf.isIE) {
            while (range.findText(val, 1, flag)) {
                range.scrollIntoView();
                range.select();
                this.replace();
                found++;
            }
            this.storeSelection();
        } else {
            while (this.editor.oWin.find(val, bMatchCase, false, false, false, false, false)) {
                this.replace();
                found++;
            }
        }

        if (found > 0)
            alert(found + " occurences found and replaced with '" + this.oReplace.value + "'");
        else
            alert("No occurences found for '" + val + "'");
    }

    this.replace = function() {
        var sRepl = this.oReplace.value;
        // Needs to be duplicated due to selection bug in IE
        if (jpf.isIE) {
            this.restoreSelection();
            this.editor.Selection.getRange().duplicate().pasteHTML(sRepl);
        } else
            this.editor.Selection.getContext().execCommand('InsertHTML', false, sRepl);
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var idSearch  = 'editor_' + this.editor.uniqueId + '_' + this.name + '_input';
        var idReplace = 'editor_' + this.editor.uniqueId + '_' + this.name + '_replace';
        var idCase    = 'editor_' + this.editor.uniqueId + '_' + this.name + '_case';
        var idFind    = 'editor_' + this.editor.uniqueId + '_' + this.name + '_find';
        var idDoRepl  = 'editor_' + this.editor.uniqueId + '_' + this.name + '_dorepl';
        var idReplAll = 'editor_' + this.editor.uniqueId + '_' + this.name + '_replall';
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
            <div class="editor_panelrow editor_panelrowinput">\
                <button id="' + idFind + '">Find next</button>' +
                (this.name == "replace" ?
               '<button id="' + idDoRepl + '">Replace</button>\
                <button id="' + idReplAll + '">Replace all</button>' : '') +
           '</div>';
        this.oSearch    = document.getElementById(idSearch);
        this.oCase      = document.getElementById(idCase);
        document.getElementById(idFind).onclick = this.submit.bindWithEvent(this);
        if (this.name == "replace") {
            this.oReplace    = document.getElementById(idReplace);
            this.oReplBtn    = document.getElementById(idDoRepl);
            this.oReplAllBtn = document.getElementById(idReplAll);
            this.oReplBtn.onmousedown    = onDoReplClick.bindWithEvent(this);
            this.oReplAllBtn.onmousedown = onReplAllClick.bindWithEvent(this);
            this.oReplBtn.disabled   = true;
        }

        //#ifdef __WITH_WINDOW_FOCUS
        if (jpf.hasFocusBug) {
            jpf.sanitizeTextbox(this.oSearch);
            if (this.oReplace)
                jpf.sanitizeTextbox(this.oReplace);
        }
        //#endif

        return panelBody;
    };
};

jpf.editor.Plugin('search',  jpf.editor.searchPlugin);
jpf.editor.Plugin('replace', jpf.editor.searchPlugin);

// #endif
