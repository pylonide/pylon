/**
 * Searchreplace Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
 
var canon = require("pilot/canon");
var search = require("ace/search");
var editors = require("ext/editors/editors");
var markup = require("text!ext/searchreplace/searchreplace.xml");

module.exports = ext.register("ext/searchreplace/searchreplace", {
    name    : "Searchreplace",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    commands : {
        "search": {hint: "search for a string inside the active document"},
        "searchreplace": {hint: "search for a string inside the active document and replace it"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Search...",
                onclick : function() {
                    _self.toggleDialog(false);
                }
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Search & Replace...",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }))
        );
        
        this.hotitems["search"] = [this.nodes[1]];
        this.hotitems["searchreplace"] = [this.nodes[2]];
        
        canon.addCommand({
            name: "replace",
            exec: function(env, args, request) { 
                _self.setEditor(env.editor, env.selection).toggleDialog(true, true);
            }
        });
        
    },

    init : function(amlNode){
        this.txtFind       = txtFind;//winSearchReplace.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        this.txtReplace    = txtReplace;//winSearchReplace.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        //bars
        this.barReplace    = barReplace;//winSearchReplace.selectSingleNode("a:vbox/a:hbox[2]");
        //buttons
        this.btnReplace    = btnReplace;//winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[1]");
        this.btnReplace.onclick = this.replace.bind(this);
        this.btnReplaceAll = btnReplaceAll;//winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[2]");
        this.btnReplaceAll.onclick = this.replaceAll.bind(this);
        this.btnFind       = btnFind;//winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[3]");
        this.btnFind.onclick = this.findNext.bind(this);
        winSearchReplace.onclose = function() {
            ceEditor.focus();
        }
    },

    toggleDialog: function(isReplace, forceShow) {
        ext.initExtension(this);
        
        if (!winSearchReplace.visible || forceShow || this.$lastState != isReplace) {
            this.setupDialog(isReplace);

            var editor = editors.currentEditor;
            if (editor) {
                if (editor.ceEditor)
                    var value = editor.ceEditor.getLastSearchOptions().needle;

                if (!value) {
                    var sel   = editor.getSelection();
                    var doc   = editor.getDocument();
                    var range = sel.getRange();
                    var value = doc.getTextRange(range);
                }
                if (value)
                    this.txtFind.setValue(value);

                winSearchReplace.setAttribute("title", isReplace
                        ? "Search & Replace" : "Search");            
                winSearchReplace.show();
            }
        }
        else
            winSearchReplace.hide();
        return false;
    },

    onHide : function() {
        var editor = require('ext/editors/editors').currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.focus();
    },

    search: function() {
        return this.setEditor().toggleDialog(false, true);
    },

    searchreplace: function() {
        return this.setEditor().toggleDialog(true, true);
    },

    setupDialog: function(isReplace) {
        this.$lastState = isReplace;
        
        // hide all 'replace' features
        this.barReplace.setProperty("visible", isReplace);
        this.btnReplace.setProperty("visible", isReplace);
        this.btnReplaceAll.setProperty("visible", isReplace);
        return this;
    },

    setEditor: function(editor, selection) {
        if (typeof ceEditor == "undefined")
            return;
        this.$editor = editor || ceEditor.$editor;
        this.$selection = selection || this.$editor.getSelection();
        return this;
    },

    getOptions: function() {
        return {
            backwards: chkSearchBackwards.checked,
            wrap: chkWrapAround.checked,
            caseSensitive: chkMatchCase.checked,
            wholeWord: chkWholeWords.checked,
            regExp: chkRegEx.checked,
            scope: chkSearchSelection.checked ? search.Search.SELECTION : search.Search.ALL
        };
    },

    findNext: function() {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;
        var txt = this.txtFind.getValue();
        if (!txt)
            return;
        var options = this.getOptions();

        if (this.$crtSearch != txt) {
            this.$crtSearch = txt;
            // structure of the options:
            // {
            //     needle: "",
            //     backwards: false,
            //     wrap: false,
            //     caseSensitive: false,
            //     wholeWord: false,
            //     regExp: false
            // }
            this.$editor.find(txt, options);
        }
        else {
            this.$editor.find(txt, options);
        }
        chkSearchSelection.setAttribute("checked", false);
    },

    replace: function() {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;
        if (!this.barReplace.visible)
            return;
        var options = this.getOptions();
        options.needle = this.txtFind.getValue()
        options.scope = search.Search.SELECTION;
        this.$editor.replace(this.txtReplace.getValue() || "", options);
        this.$editor.find(this.$crtSearch, options);
        ide.dispatchEvent("track_action", {type: "replace"});
    },

    replaceAll: function() {
        if (!this.editor)
            this.setEditor();
        if (!this.$editor)
            return;
        this.$crtSearch = null;
        var options = this.getOptions();
        options.needle = this.txtFind.getValue()
        this.$editor.replaceAll(this.txtReplace.getValue() || "", options);
        ide.dispatchEvent("track_action", {type: "replace"});
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});