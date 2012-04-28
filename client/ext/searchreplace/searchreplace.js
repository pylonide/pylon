/**
 * Searchreplace Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var menus = require("ext/menus/menus");
var code = require("ext/code/code");
var search = require("ace/search");
var editors = require("ext/editors/editors");
var css = require("text!ext/searchreplace/searchreplace.css");
var markup = require("text!ext/searchreplace/searchreplace.xml");
var commands = require("ext/commands/commands");

var oIter, oTotal;

module.exports = ext.register("ext/searchreplace/searchreplace", {
    name    : "Searchreplace",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    css     : css,
    markup  : markup,

    currentRange: null,
    
    nodes   : [],

    hook : function(){
        var _self = this;

        commands.addCommand({
            name: "replace",
            bindKey : {mac: "Option-Command-F", win: "Alt-Shift-F"},
            hint: "search for a string inside the active document and replace it",
            isAvailable : function(editor){
                return editor && editor.ceEditor;
            },
            exec: function(env, args, request) {
                _self.toggleDialog(true, true);
            }
        });
        
        commands.addCommand({
            name: "replacenext",
            isAvailable : function(editor){
                return editor && editor.ceEditor;
            },
            exec: function(env, args, request) {
                commands.exec("findnext");
                commands.exec("replace");
            }
        });
        
        commands.addCommand({
            name: "replaceprevious",
            isAvailable : function(editor){
                return editor && editor.ceEditor;
            },
            exec: function(env, args, request) {
                commands.exec("findprevious");
                commands.exec("replace");
            }
        });

        this.nodes.push(
            menus.addItemByPath("Find/Find...", new apf.item({
                onclick : function() {
                    _self.toggleDialog(false);
                }
            }), 100),
            menus.addItemByPath("Find/Find Next", new apf.item({
                command : "findnext"
            }), 200),
            menus.addItemByPath("Find/Find Previous", new apf.item({
                command : "findprevious"
            }), 300),
            menus.addItemByPath("Find/~", new apf.divider(), 400),
            menus.addItemByPath("Find/Replace...", new apf.item({
                command : "replace"
            }), 500),
            menus.addItemByPath("Find/Replace Next", new apf.item({
                command : "replacenext",
            }), 600),
            menus.addItemByPath("Find/Replace Previous", new apf.item({
                command : "replaceprevious",
            }), 700),
            menus.addItemByPath("Find/Replace All", new apf.item({
                command : "replaceall"
            }), 800)
        );
    },

    init : function(amlNode){
        var _self = this;
        apf.importCssString(_self.css);
        
        this.txtFind       = txtFind;//winSearchReplace.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        this.txtReplace    = txtReplace;//winSearchReplace.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        //bars
        this.barSingleReplace    = barSingleReplace;//winSearchReplace.selectSingleNode("a:vbox/a:hbox[2]");
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
        
        this.txtFind.$ext.cols = this.txtFind.cols;
        
        this.txtFind.addEventListener("keydown", function(e){
            switch (e.keyCode){
//                case 13: //ENTER
//                    _self.execSearch(false, !!e.shiftKey);
//                    return false;
//                case 27: //ESCAPE
//                    _self.toggleDialog(-1);
//                    if (e.htmlEvent)
//                        apf.stopEvent(e.htmlEvent)
//                    else if (e.stop)
//                        e.stop();
//                    return false;
                case 38: //UP
                    _self.navigateList("prev");
                break;
                case 40: //DOWN
                    _self.navigateList("next");
                break;
                case 36: //HOME
                    if (!e.ctrlKey) return;
                    _self.navigateList("first");
                break;
                case 35: //END
                    if (!e.ctrlKey) return;
                    _self.navigateList("last");
                break;
            }
        });
    },
    
    navigateList : function(type){
        var settings = require("ext/settings/settings");
        if (!settings) return;
        
        var model = settings.model;
        var lines = model.queryNodes("search/word");
        
        var next;
        if (type == "prev")
            next = Math.max(0, this.position - 1);
        else if (type == "next")
            next = Math.min(lines.length - 1, this.position + 1);
        else if (type == "last")
            next = Math.max(lines.length - 1, 0);
        else if (type == "first")
            next = 0;

        if (lines[next]) {
            this.txtFind.setValue(lines[next].getAttribute("key"));
            this.txtFind.select();
            this.position = next;
        }
    },
    
    toggleDialog: function(isReplace, forceShow) {
        ext.initExtension(this);

        if (!winSearchReplace.visible || forceShow || this.$lastState != isReplace) {
            this.setupDialog(isReplace);

            var value;
            var editor = editors.currentEditor;
            if (editor) {
                if (editor.ceEditor)
                    value = editor.ceEditor.getLastSearchOptions().needle;

                if (!value) {
                    var sel   = editor.getSelection();
                    var doc   = editor.getDocument();
                    var range = sel.getRange();
                    value = doc.getTextRange(range);
                }
                
                if (value)
                    this.txtFind.setValue(value);

                ide.dispatchEvent("exitfullscreen");

                winSearchReplace.setAttribute("title", isReplace
                        ? "Search & Replace" : "Search");
                winSearchReplace.show();
            }
            this.updateCounter();
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
        this.position = 0;

        // hide all 'replace' features
        this.barSingleReplace.setProperty("visible", isReplace);
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

    findNext: function(backwards) {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;
        var txt = this.txtFind.getValue();
        if (!txt) 
            return;
        var options = this.getOptions();
        
        if (backwards)
            options.backwards = true;

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
            this.currentRange = this.$editor.selection.getRange();
        }
        else {
            this.$editor.find(txt, options);
            this.currentRange = this.$editor.selection.getRange();
        }
        chkSearchSelection.setAttribute("checked", false);
        this.updateCounter();
    },

    replace: function() {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;
        if (!this.barSingleReplace.visible)
            return;
        var options = this.getOptions();
        options.needle = this.txtFind.getValue();
        options.scope = search.Search.SELECTION;
        this.$editor.replace(this.txtReplace.getValue() || "", options);
        //this.$editor.find(this.$crtSearch, options);
        this.findNext();
        ide.dispatchEvent("track_action", {type: "replace"});
    },

    replaceAll: function() {
        if (!this.editor)
            this.setEditor();
        if (!this.$editor)
            return;
        this.$crtSearch = null;
        var options = this.getOptions();
        options.needle = this.txtFind.getValue();
        
        var cursor = this.$editor.getCursorPosition();
        var line = cursor.row;
        
        this.$editor.replaceAll(this.txtReplace.getValue() || "", options);
        
        this.$editor.gotoLine(line); // replaceAll jumps you elsewhere; go back to where you were
        
        this.updateCounter();
        ide.dispatchEvent("track_action", {type: "replace"});
    },
    
    updateCounter: function() {
        var ace = this.$getAce();
        var width, buttonWidth;

        if (!oIter) {
            oIter  = document.getElementById("spanSearchReplaceIter");
            oTotal = document.getElementById("spanSearchReplaceTotal");
        }
/*
        if (oIter.parentNode) {
            if (!ace || !winQuickSearch.visible) {
                oIter.parentNode.style.width = "0px";
                return;
            }
            else
                oIter.parentNode.style.width = "auto";
        }

        setTimeout(function() {
            if (oIter.parentNode && txtQuickSearch && txtQuickSearch.$button) {
                width = oIter.parentNode.offsetWidth || 0;
                txtQuickSearch.$button.style.right = width + "px";
            }
        });
*/
        var ranges = ace.$search.findAll(ace.getSession());
        if (!ranges || !ranges.length) {
            oIter.innerHTML = "0";
            oTotal.innerHTML = "of 0";
            return;
        }
        var crtIdx = -1;
        var cur = this.currentRange;
        if (cur) {
            // sort ranges by position in the current document
            //ranges.sort(cur.compareRange.bind(cur));
            var range;
            var start = cur.start;
            var end = cur.end;
            for (var i = 0, l = ranges.length; i < l; ++i) {
                range = ranges[i];
                if (range.isStart(start.row, start.column) && range.isEnd(end.row, end.column)) {
                    crtIdx = i;
                    break;
                }
            }
        }
        
        
        oIter.innerHTML = String(++crtIdx);
        oTotal.innerHTML = "of " + ranges.length;
    },
    
    $getAce: function() {
        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        var ceEditor = editor.ceEditor;
        return ceEditor.$editor;
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
        menus.remove("Find/Find...");
        menus.remove("Find/~", 200);
        menus.remove("Find/Replace...");
        
        commands.removeCommandsByName(["replace", "replacenext", "replaceprevious"]);
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});