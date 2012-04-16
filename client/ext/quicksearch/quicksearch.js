/**
 * quicksearch Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var Util = require("core/util");
var code = require("ext/code/code");
var editors = require("ext/editors/editors");
var Search = require("ace/search").Search;
var skin = require("text!ext/quicksearch/skin.xml");
var markup = require("text!ext/quicksearch/quicksearch.xml");
var menus = require("ext/menus/menus");

var oIter, oTotal;

//N.B. the problem is with many occurences, so a single character search breaks it.
var MAX_LINES = 20000; // alter live search if lines > 20k--performance bug
var MAX_LINES_SOFT = 8000; // single character search prohibited

module.exports = ext.register("ext/quicksearch/quicksearch", {
    name    : "quicksearch",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    skin    : {
        id  : "quicksearch",
        data : skin,
        "icon-path" : ide.staticPrefix + "/ext/quicksearch/icons/"
    },
    markup  : markup,
    commands : {
        "quicksearch": {hint: "quickly search for a string inside the active document, without further options (see 'search')"},
        "find": {hint: "open the quicksearch dialog to quickly search for a phrase"},
        "findnext": {
            hint: "search for the next occurrence of the search query your entered last",
            msg: "Navigating to next match."
        },
        "findprevious": {
            hint: "search for the previous occurrence of the search query your entered last",
            msg: "Navigating to previous match."
        }
    },
    defaultOffset : 30,
    offsetWidth : 30,
    hotitems: {},

    nodes   : [],

    currentRange: null,

    hook : function(){
        var _self = this;
        code.commandManager.addCommand({
            name: "find",
            exec: function(env, args, request) {
                _self.toggleDialog(1);
            }
        });

        ide.addEventListener("minimap.visibility", function(e) {
            if (e.visibility === "shown")
                _self.offsetWidth = _self.defaultOffset + e.width;
            else
                _self.offsetWidth = _self.defaultOffset;

            _self.updateBarPosition();
        });

        ide.addEventListener("revisions.visibility", function(e) {
            if (e.visibility === "shown")
                _self.offsetWidth = _self.defaultOffset + e.width;
            else
                _self.offsetWidth = _self.defaultOffset;

            _self.updateBarPosition();
        });
        
        var mnuItem;
        this.nodes.push(
            menus.addItemByPath("Find/~", new apf.divider(), 700),

            mnuReplace = menus.addItemByPath("Find/Quick Find", new apf.item({
                onclick : function() {
                    _self.toggleDialog(1);
                }
            }), 800)
        );
        
        this.hotitems.quicksearch = [mnuItem];
    },

    init : function(amlNode){
        var _self = this;
        var ace;
        
        txtQuickSearch.addEventListener("clear", function(e) {
            _self.execSearch(false, false, true);
        })
        
        txtQuickSearch.addEventListener("keydown", function(e) {
            switch (e.keyCode){
                case 13: //ENTER
                    _self.execSearch(false, !!e.shiftKey, null, true);
                    return false;
                case 27: //ESCAPE
                    _self.toggleDialog(-1);
                    
                    if (txtQuickSearch.getValue())
                        _self.saveHistory(txtQuickSearch.getValue());
                    
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
                    if (!e.ctrlKey) return;
                    _self.navigateList("first");
                    break;
                case 35: //END
                    if (!e.ctrlKey) return;
                    _self.navigateList("last");
                    break;
            }
            
            var ace = _self.$getAce();
            if (ace.getSession().getDocument().getLength() > MAX_LINES) { 
                // fall back to break
            }
            else if (e.keyCode == 32 || (e.keyCode >=35 && e.keyCode <= 40) || (e.keyCode >=48 && e.keyCode <= 90) || (e.keyCode >=96 && e.keyCode <= 111) ||
                    (e.keyCode >=186 && e.keyCode <= 191) || (e.keyCode >=219 && e.keyCode <= 222)) {       
                    // chillax, then fire--necessary for rapid key strokes
                    setTimeout(function() {
                        _self.execSearch(false, false);
                    }, 20);  
                }
            return;
        });
        
        txtQuickSearch.addEventListener("keyup", function(e) {
            ace = _self.$getAce();
            switch (e.keyCode) {
                case 8: // BACKSPACE
                    var ace = _self.$getAce();
                    if (ace.getSession().getDocument().getLength() > MAX_LINES) { 
                        // fall back to return
                    }
                    else {
                        _self.execSearch(false, !!e.shiftKey, true);
                    }
                    return false;
                case 27:
                    _self.toggleDialog(-1);
                    break;
            }
        }); 
        
        winQuickSearch.addEventListener("blur", function(e){
            if (winQuickSearch.visible && !apf.isChildOf(winQuickSearch, e.toElement))
                _self.toggleDialog(-1);
        });
        txtQuickSearch.addEventListener("blur", function(e){
            if (self.winQuickSearch && winQuickSearch.visible 
              && !apf.isChildOf(winQuickSearch, e.toElement))
                _self.toggleDialog(-1);
        });
        
        ide.addEventListener("closepopup", function(e){
            if (e.element != _self)
                _self.toggleDialog(-1, true);
        });

        var editor = editors.currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.parentNode.appendChild(winQuickSearch);

        setTimeout(function() {
            _self.updateBarPosition();
        });
    },

    updateBarPosition : function() {
        if (!window["winQuickSearch"])
            return;

        winQuickSearch.setAttribute("right", this.offsetWidth);
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
            txtQuickSearch.setValue(lines[next].getAttribute("key"));
            txtQuickSearch.select();
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

        var ranges = ace.$search.findAll(ace.getSession());
        if (!ranges || !ranges.length || !txtQuickSearch.getValue()) {
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

    toggleDialog: function(force, noanim) {
        ext.initExtension(this);

        var editorPage = tabEditors.getPage();
        if (!editorPage) return;

        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        var _self = this;

        if (!force && !winQuickSearch.visible || force > 0) {
            this.position = -1;
            
            if (this.control && this.control.stop)
                this.control.stop();

            var sel   = editor.getSelection();
            var doc   = editor.getDocument();
            var range = sel.getRange();
            var value = doc.getTextRange(range);

            if (!value && editor.ceEditor)
               value = editor.ceEditor.getLastSearchOptions().needle;

            if (value)
                txtQuickSearch.setValue(value);

            ide.dispatchEvent("closepopup", {element: this});

            winQuickSearch.$ext.style.top = "-30px";
            winQuickSearch.show();
            txtQuickSearch.focus();
            txtQuickSearch.select();
            
            //Animate
            apf.tween.single(winQuickSearch, {
                type     : "top",
                anim     : apf.tween.easeInOutCubic,
                from     : -27,
                to       : 2,
                steps    : 8,
                interval : 10,
                control  : (this.control = {}),
                onfinish : function() {
                    divSearchCount.$ext.style.visibility = "";
                    _self.updateCounter();
                }
            });
        }
        else if (winQuickSearch.visible) {
            if (this.control && this.control.stop)
                this.control.stop();
                
            divSearchCount.$ext.style.visibility = "hidden";
            
            if (!noanim) {
                winQuickSearch.visible = false;
                
                txtQuickSearch.focus();
                txtQuickSearch.select();

                //Animate
                apf.tween.single(winQuickSearch, {
                    type     : "top",
                    anim     : apf.tween.NORMAL,
                    from     : winQuickSearch.$ext.offsetTop,
                    to       : -30,
                    steps    : 8,
                    interval : 10,
                    control  : (this.control = {}),
                    onfinish : function(){    
                        winQuickSearch.visible = true;
                        winQuickSearch.hide();
                        
                        editor.ceEditor.focus();
                    }
                });
            }
            else {
                winQuickSearch.hide();
            }
        }
        
        return false;
    },

    quicksearch : function(){
        this.toggleDialog();
    },

    execSearch: function(close, backwards, wasDelete, save) {
        var ace = this.$getAce();
        if (!ace)
            return;

        var searchTxt = txtQuickSearch.getValue();
            
        if (searchTxt.length < 2 && ace.getSession().getDocument().getLength() > MAX_LINES_SOFT)
            return;

        //if (!searchTxt)
          //  return this.updateCounter();
        
        var options = {
            backwards: !!backwards,
            wrap: true,
            caseSensitive: false,
            wholeWord: false,
            regExp: false,
            scope: Search.ALL
        };

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
            winQuickSearch.hide();
            editors.currentEditor.ceEditor.focus();
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
        this.toggleDialog();
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
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
