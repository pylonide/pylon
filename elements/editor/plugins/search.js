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

        this.editor.showPopup(this, this.uniqueId, this.buttonNode,
            this.name == "search" ? 200 : 306, this.name == "search" ? 80 : 103);
        // prefill search box with selected text
        this.oSearch.value = this.editor.selection.getContent();
        if (panelBody.style.visibility == "hidden")
            panelBody.style.visibility = "visible";
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

        e.cancelBubble = true;
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
        panelBody.style.visibility = "hidden";
        var idSearch  = 'editor_' + this.editor.uniqueId + '_' + this.name + '_input';
        var idReplace = 'editor_' + this.editor.uniqueId + '_' + this.name + '_replace';
        var idCase    = 'editor_' + this.editor.uniqueId + '_' + this.name + '_case';
        var idBtns    = 'editor_' + this.editor.uniqueId + '_' + this.name + '_btns';
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
        var oBtns    = document.getElementById(idBtns);
        var oFind    = this.appendJmlNode('<j:button  xmlns:j="' + jpf.ns.jml
            + '" caption="Find next" bottom="0" ' +
            (this.name == "search" ? 'right="6"' : 'left="2"')
            + ' onclick="jpf.lookup(' + this.uniqueId + ').submit(event)" />', oBtns);

        if (this.name == "replace") {
            this.oReplace    = document.getElementById(idReplace);
            this.oReplBtn    = this.appendJmlNode('<j:button xmlns:j="'
                + jpf.ns.jml + '" caption="Replace" bottom="0" right="6" \
                onclick="jpf.lookup(' + this.uniqueId + ').onDoReplClick(event)" />',
                oBtns);
            this.oReplAllBtn = this.appendJmlNode('<j:button xmlns:j="'
                + jpf.ns.jml + '" caption="Replace all" bottom="0" right="106" \
                onclick="jpf.lookup(' + this.uniqueId + ').onReplAllClick(event)" />',
                oBtns);
            this.oReplBtn.disable();
        }

        //#ifdef __WITH_WINDOW_FOCUS
        if (jpf.hasFocusBug) {
            jpf.sanitizeTextbox(this.oSearch);
            if (this.oReplace)
                jpf.sanitizeTextbox(this.oReplace);
        }
        //#endif

        setTimeout(function() {
            panelBody.style.visibility = "visible";
        });

        return panelBody;
    };
};

jpf.editor.plugin('search',  jpf.editor.searchPlugin);
jpf.editor.plugin('replace', jpf.editor.searchPlugin);

// #endif
