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

apf.LiveEdit.searchPlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARPANEL;
    this.hook        = "ontoolbar";
    this.keyBinding  = this.name == "search" ? "ctrl+f" : "ctrl+shift+f";
    this.state       = apf.OFF;

    var panelBody;

    this.init = function(editor, btn) {
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

        this.editor.$showPopup(this, this.$uniqueId, this.buttonNode, 218,
            this.name == "search" ? 71 : 95);
        // prefill search box with selected text
        this.oSearch.value = this.editor.$selection.getContent();
        var _self = this;
        $setTimeout(function() {
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
        var val = this.oSearch.value, bMatchCase = this.oCase.checked, flag = 0;
        if (!val)
            return;

        if (apf.isIE)
            this.editor.$selection.set();
        //this.editor.$execCommand("SelectAll");
        this.editor.$selection.collapse(false);
        this.editor.$visualFocus();

        if (bMatchCase) //IE specific flagging
            flag = flag | 4;

        var found = false;

        if (apf.isIE) {
            var sel   = this.editor.$selection;
            var range = sel.getRange();
            if (!(found = range.findText(val, 1, flag))) {
                // simulate 'wrapAround' search...
                this.editor.$activeDocument.execCommand("SelectAll");
                sel.collapse(true);
                range = sel.getRange();
                //no chaining of calls here, seems to b0rk selection in IE
                found = range.findText(val, 1, flag);
            }
            if (found) {
                range.scrollIntoView();
                range.select();
            }
            //this.storeSelection();
            sel.cache();
        }
        else {
            if (this.editor.oWin.find(val, bMatchCase, false, true, false, false, false))
                found = true;
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

        if (!apf.isIE) {
            // IE cannot show the selection anywhere else then where the cursor
            // is, so no show for them users...
            var _self = this;
            $setTimeout(function() {
                _self.oSearch.focus();
            });
        }

        return false;
    };

    this.onDoReplClick = function(e) {
        this.replace();
    };

    this.onReplAllClick = function(e) {
        var val = this.oSearch.value, bMatchCase = this.oCase.checked, flag = 0,
            ed  = this.editor;
        if (!val)
            return;

        // Move caret to beginning of text
        this.editor.$execCommand("SelectAll");
        this.editor.$selection.collapse(true);
        this.editor.$visualFocus();

        var range = this.editor.$selection.getRange(), found = 0;

        if (bMatchCase) //IE specific flagging
            flag = flag | 4;

        if (apf.isIE) {
            while (range.findText(val, 1, flag)) {
                range.scrollIntoView();
                range.select();
                this.replace();
                found++;
            }
            this.editor.$selection.cache();
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
        if (apf.isIE) {
            //this.editor.$selection.set(); //Change by RLD
            this.editor.$selection.getRange().duplicate().pasteHTML(sRepl);
        }
        else
            this.editor.$activeDocument.execCommand("InsertHTML", false, sRepl);
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement("div"));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";
        var idSearch     = "editor_" + this.$uniqueId + "_input",
            idReplace    = "editor_" + this.$uniqueId + "_replace",
            idCase       = "editor_" + this.$uniqueId + "_case",
            idBtns       = "editor_" + this.$uniqueId + "_btns";
        panelBody.innerHTML =
           '<div class="editor_panelrow editor_panelrowinput">\
                <label for="' + idSearch + '">Find what</label>\
                <textarea type="text" id="' + idSearch + '" class="editor_input" name="' + idSearch + '" value="">\
                </textarea>\
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
        
        new apf.toolbar({
            htmlNode: document.getElementById(idBtns),
            skinset: apf.getInheritedAttribute(this.editor.parentNode, "skinset"),
            childNodes: [
                new apf.bar({
                    childNodes: this.name == "search"
                        ? [new apf.button({
                               caption: this.editor.$translate("findnext"),
                               onclick: "apf.lookup(" + this.$uniqueId + ").submit(event)"
                           })]
                        : [
                              new apf.button({
                                  caption: this.editor.$translate("findnext"),
                                  onclick: "apf.lookup(" + this.$uniqueId + ").submit(event)"
                              }),
                              (this.oReplBtn = new apf.button({
                                  caption: this.editor.$translate("doreplace"),
                                  onclick: "apf.lookup(" + this.$uniqueId + ").onDoReplClick(event)"
                              })),
                              (this.oReplAllBtn = new apf.button({
                                  caption: this.editor.$translate("replaceall"),
                                  onclick: "apf.lookup(" + this.$uniqueId + ").onReplAllClick(event)"
                              }))
                          ]
                })
            ]
        });

        if (this.name == "replace") {
            this.oReplace = document.getElementById(idReplace);
            this.oReplBtn.disable();
        }

        //#ifdef __WITH_WINDOW_FOCUS
        if (apf.hasFocusBug) {
            var fSel = function(e) {
                e = e || window.event;
                e.cancelBubble = true;
            };
            apf.sanitizeTextbox(this.oSearch);
            this.oSearch.onselectstart = fSel;
            if (this.oReplace) {
                apf.sanitizeTextbox(this.oReplace);
                this.oReplace.onselectstart = fSel;
            }
            // checkboxes also need the focus fix:
            apf.sanitizeTextbox(this.oCase);
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

apf.LiveEdit.plugin("search",  apf.LiveEdit.searchPlugin);
apf.LiveEdit.plugin("replace", apf.LiveEdit.searchPlugin);

// #endif
