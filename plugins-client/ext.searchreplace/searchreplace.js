/**
 * Searchreplace Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var Util = require("core/util");
var menus = require("ext/menus/menus");
var search = require("ace/search");
var editors = require("ext/editors/editors");
var css = require("text!ext/searchreplace/searchreplace.css");
var skin = require("text!ext/searchreplace/skin.xml");
var markup = require("text!ext/searchreplace/searchreplace.xml");
var commands = require("ext/commands/commands");

var oIter, oTotal;

//N.B. the problem is with many occurences, so a single character search breaks it.
var MAX_LINES = 20000; // alter live search if lines > 20k--performance bug
var MAX_LINES_SOFT = 8000; // single character search prohibited

module.exports = ext.register("ext/searchreplace/searchreplace", {
    name    : "Searchreplace",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    css     : css,
    markup  : markup,
    
    skin    : {
        id  : "searchreplace",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/searchreplace/images/",
        "icon-path" : ide.staticPrefix + "/ext/searchreplace/icons/"
    },

    currentRange: null,
    
    nodes   : [],

    hook : function(){
        var _self = this;
        
        this.markupInsertionPoint = mainRow;

        commands.addCommand({
            name: "replace",
            bindKey : {mac: "Option-Command-F", win: "Alt-Shift-F"},
            hint: "search for a string inside the active document and replace it",
            isAvailable : function(editor){
                return editor && editor.ceEditor;
            },
            exec: function(env, args, request) {
                _self.toggleDialog(1, true);
            }
        });

        commands.addCommand({
            name: "replaceall",
            bindKey : {mac: "", win: ""},
            hint: "search for a string inside the active document and replace all",
            isAvailable : function(editor){
                return editor && editor.ceEditor;
            },
            exec: function(env, args, request) {
                _self.replaceAll();//toggleDialog(1, true);
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
        
        ide.addEventListener("init.ext/code/code", function(){
            commands.commands["findnext"].hint = "search for the next occurrence of the search query your entered last";
            commands.commands["findnext"].msg = "Navigating to next match.";
            commands.commands["findprevious"].hint = "search for the previous occurrence of the search query your entered last";
            commands.commands["findprevious"].msg = "Navigating to previous match.";
        });
        
        commands.addCommand({
            name: "find",
            hint: "open the quicksearch dialog to quickly search for a phrase",
            bindKey: {mac: "Command-F", win: "Ctrl-F"},
            isAvailable : function(editor){
                return editor && editor.ceEditor;
            },
            exec: function(env, args, request) {
                _self.toggleDialog(1, false);
            }
        });

        this.nodes.push(
            menus.addItemByPath("Find/Find...", new apf.item({
                command : "find"
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
        
        var isAvailable = commands.commands["findnext"].isAvailable;
        commands.commands["findnext"].isAvailable =
        commands.commands["findprevious"].isAvailable = function(editor){
            if (apf.activeElement == txtFind)
                return true;
            
            return isAvailable.apply(this, arguments);
        }
        
        apf.importCssString(_self.css);
        
        //This needs to go into the onfinish of the anim
//            if (editors.currentEditor && editors.currentEditor.amlEditor)
//                editors.currentEditor.amlEditor.focus();
        
        ide.addEventListener("init.ext/console/console", function(e){
            winSearchReplace.parentNode.insertBefore(
                winSearchReplace, winDbgConsole);
        });
        
        //txtFind.$ext.cols = txtFind.cols;
        
        txtFind.addEventListener("clear", function() {
            _self.execSearch(false, false, true);
        })

        txtFind.addEventListener("keydown", function(e) {
            switch (e.keyCode){
                case 13: //ENTER
                    _self.execSearch(false, !!e.shiftKey, null, true);
                    return false;
                case 27: //ESCAPE
                    _self.toggleDialog(-1);

                    if (txtFind.getValue())
                        _self.saveHistory(txtFind.getValue());

                    if (e.htmlEvent)
                        apf.stopEvent(e.htmlEvent);
                    else if (e.stop)
                        e.stop();
                    return false;
                case 38: //UP
                    _self.navigateList("prev");
                    break;
                case 40: //DOWN
                    _self.navigateList("next");
                    break;
                case 36: //HOME
                    if (!e.ctrlKey)
                        return;
                    _self.navigateList("first");
                    break;
                case 35: //END
                    if (!e.ctrlKey)
                        return;
                    _self.navigateList("last");
                    break;
            }

            var ace = _self.$getAce();
            if (ace.getSession().getDocument().getLength() > MAX_LINES)
                return;

            if (e.keyCode == 8 || !e.ctrlKey && !e.metaKey && apf.isCharacter(e.keyCode)) {
                clearTimeout(this.$timer);
                this.$timer = setTimeout(function() { // chillax, then fire--necessary for rapid key strokes
                    _self.execSearch(false, false, e.keyCode == 8);
                }, 20);
            }

            return;
        });
        
        //@todo make this a setting
//        txtFind.addEventListener("blur", function(e){
//            
//            if (self.winSearchReplace && winSearchReplace.visible
//              && !apf.isChildOf(winSearchReplace, e.toElement))
//                _self.toggleDialog(-1);
//        });
    },
    
    navigateList : function(type){
        var settings = require("ext/settings/settings");
        if (!settings)
            return;

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
            txtFind.setValue(lines[next].getAttribute("key"));
            txtFind.select();
            this.position = next;
        }
    },

    updateCounter: function(backwards) {
        var ace = this.$getAce();
        var width;

        if (!oIter) {
            oIter  = document.getElementById("spanSearchIter");
            oTotal = document.getElementById("spanSearchTotal");
        }

        if (oIter.parentNode) {
            if (!ace || !winSearchReplace.visible) {
                oIter.parentNode.style.width = "0px";
                return;
            }
            else
                oIter.parentNode.style.width = "auto";
        }

        setTimeout(function() {
            if (oIter.parentNode && txtFind && txtFind.$button) {
                width = oIter.parentNode.offsetWidth || 0;
                txtFind.$button.style.right = width + "px";
            }
        });

        var ranges = ace.$search.findAll(ace.getSession());
        if (!ranges || !ranges.length || !txtFind.getValue()) {
            oIter.innerHTML = "0";
            oTotal.innerHTML = "of 0";
            return;
        }

        if (backwards) {
            var newCount = oIter.innerHTML - 1;
            if (newCount < 1) {
                newCount = String(ranges.length);
            }
            oIter.innerHTML = String(newCount);
        }
        else {
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
        }

        oTotal.innerHTML = "of " + ranges.length;
    },
    
    toggleDialog: function(force, isReplace) {
        ext.initExtension(this);

        var editor = editors.currentEditor;
        if (!editor || !editor.amlEditor)
            return;

        if (!force && !winSearchReplace.visible || force > 0 || this.$lastState != isReplace) {
            if (winSearchReplace.visible && this.$lastState == isReplace)
                return;
            
            this.setupDialog(isReplace);

            this.position = -1;

            var sel   = editor.getSelection();
            var doc   = editor.getDocument();
            var range = sel.getRange();
            var value = doc.getTextRange(range);

            if (!value && editor.amlEditor)
                value = editor.amlEditor.getLastSearchOptions().needle;

            if (value)
                txtFind.setValue(value);

            winSearchReplace.show();
            txtFind.focus();
            txtFind.select();
        }
        else if (winSearchReplace.visible) {
            divSearchCount.$ext.style.visibility = "hidden";
            winSearchReplace.hide();
        }

        return false;
    },

    onHide : function() {
        var editor = editors.currentEditor;
        if (editor && editor.amlEditor)
            editor.amlEditor.focus();
    },

    search: function() {
        return this.setEditor().toggleDialog(1, false);
    },

    searchreplace: function() {
        return this.setEditor().toggleDialog(1, true);
    },

    setupDialog: function(isReplace) {
        if (this.$lastState == isReplace)
            return;
        
        this.$lastState = isReplace;
        this.position = 0;
        
        var sbox = hboxFind.childNodes[2];
        var rbox = hboxReplace.childNodes[1];

        if (isReplace) {
            hboxReplace.show();
            rbox.appendChild(chkHighlightMatches);
            sbox.hide();
        }
        else {
            hboxReplace.hide();
            sbox.appendChild(chkHighlightMatches);
            sbox.show();
        }
        
        return this;
    },

    setEditor: function(editor, selection) {
        if (typeof editors.currentEditor.amlEditor == "undefined")
            return;
        this.$editor = editor || editors.currentEditor.amlEditor.$editor;
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
        var txt = txtFind.getValue();
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
    
    execSearch: function(close, backwards, wasDelete, save) {
        var ace = this.$getAce();
        if (!ace)
            return;

        var searchTxt = txtFind.getValue();

        if (searchTxt.length < 2 && ace.getSession().getDocument().getLength() > MAX_LINES_SOFT)
            return;

        //if (!searchTxt)
          //  return this.updateCounter();

        var options = this.getOptions();
        
        if (typeof backwards == "boolean")
            options.backwards = !!backwards;

        if (this.$crtSearch != searchTxt)
            this.$crtSearch = searchTxt;

        var highlightTxt = ace.session.getTextRange(ace.selection.getRange());

        // super ace bug ! if you're already highlighting some text, another find executes
        // from the end of the cursor, not the start of your current highlight. thus,
        // if the text is "copyright" and you execute a search for "c", followed immediately by
        // "co", you'll never find the "co"--a search for "c" followed by a search for "o"
        // DOES work, but doesn't highlight the content, so it's kind of lame.
        // Let's just reset the cursor in the doc whilst waiting for an Ace fix, hm?

        if (highlightTxt !== "") {
            // we have a selection, that is the start of the current needle, but selection !== needle
            if (!wasDelete) {
                var highlightTxtReStart = new RegExp("^" + Util.escapeRegExp(highlightTxt), "i");

                                                                            // if we're going backwards, reset the cursor anyway
                if (searchTxt.match(highlightTxtReStart) && (options.backwards || searchTxt.toLowerCase() != highlightTxt.toLowerCase())) {
                    ace.selection.moveCursorTo(ace.selection.getRange().start.row, ace.selection.getRange().end.column - highlightTxt.length);
                }
            }
            else { // we've deleted a letter, so stay on the same highlighted term
                var searchTxtReStart = new RegExp("^" + Util.escapeRegExp(searchTxt), "i");

                if (highlightTxt.match(searchTxtReStart) && searchTxt.toLowerCase() != highlightTxt.toLowerCase()) {
                    ace.selection.moveCursorTo(ace.selection.getRange().start.row, ace.selection.getRange().end.column - searchTxt.length - 1);
                }
            }
        }

        ace.find(searchTxt, options);
        this.currentRange = ace.selection.getRange();

        if (save)
            this.saveHistory(searchTxt);

        if (close) {
            winSearchReplace.hide();
            editors.currentEditor.amlEditor.focus();
        }

        this.updateCounter(backwards);
    },

    saveHistory : function(searchTxt){
        var settings = require("ext/settings/settings");
        if (!settings.model)
            return;

        var history = settings.model;
        var search = apf.createNodeFromXpath(history.data, "search");

        if (!search.firstChild || search.firstChild.getAttribute("key") != searchTxt) {
            var keyEl = apf.getXml("<word />");
            keyEl.setAttribute("key", searchTxt);
            apf.xmldb.appendChild(search, keyEl, search.firstChild);
        }
    },

    find: function() {
        this.toggleDialog(1);
        return false;
    },

    findnext: function(e) { // apparently, CMD + G executes a search;
        if (e !== 1) {      // halt that by forcing this method to come from a click
            return;
        }

        var ace = this.$getAce();
        if (!ace)
            return;

        ace.findNext();
        this.currentRange = ace.selection.getRange();
        this.updateCounter();
        return false;
    },

    findprevious: function(e) {
        if (e !== 1) {
            return;
        }

        var ace = this.$getAce();
        if (!ace)
            return;

        ace.findPrevious();
        this.currentRange = ace.selection.getRange();
        this.updateCounter(true);
        return false;
    },

    replace: function() {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;
        var options = this.getOptions();
        options.needle = txtFind.getValue();
        options.scope = search.Search.SELECTION;
        this.$editor.replace(txtReplace.getValue() || "", options);
        //this.$editor.find(this.$crtSearch, options);
        this.findNext();
        ide.dispatchEvent("track_action", {type: "replace"});
    },

    replaceAll: function() {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;
        this.$crtSearch = null;
        var options = this.getOptions();
        options.needle = txtFind.getValue();
        
        this.$editor.replaceAll(txtReplace.getValue() || "", options);

        this.updateCounter();
        ide.dispatchEvent("track_action", {type: "replace"});
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