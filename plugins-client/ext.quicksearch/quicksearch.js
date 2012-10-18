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
var commands = require("ext/commands/commands");

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
    defaultOffset : 30,
    offsetWidth : 30,

    nodes   : [],

    currentRange: null,

    hook : function(){
    },

    init : function(){
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
        if (!editor || !editor.amlEditor)
            return;

        editor.amlEditor.parentNode.appendChild(winQuickSearch);

        var _self = this;

        if (!force && !winQuickSearch.visible || force > 0) {
            if (winQuickSearch.visible)
                return;

            this.position = -1;

            if (this.control && this.control.stop)
                this.control.stop();

            var sel   = editor.getSelection();
            var doc   = editor.getDocument();
            var range = sel.getRange();
            var value = doc.getTextRange(range);
            var corrected = ide.dispatchEvent("ext.quicksearch.correctpos", {
                anim: "out"
            });

            if (!value && editor.amlEditor)
                value = editor.amlEditor.getLastSearchOptions().needle;

            if (value)
                txtQuickSearch.setValue(value);

            ide.dispatchEvent("closepopup", {element: this});

            winQuickSearch.$ext.style.top = "-27px";
            winQuickSearch.show();
            txtQuickSearch.focus();
            txtQuickSearch.select();

            if (corrected) {
                if (typeof corrected.right != "undefined")
                    winQuickSearch.$ext.style.right = corrected.right + "px";
                winQuickSearch.$ext.style.zIndex = corrected.zIndex || winQuickSearch.zindex;
            }
            else {
                winQuickSearch.$ext.style.zIndex = winQuickSearch.zindex;
            }

            //Animate
            apf.tween.single(winQuickSearch, {
                type     : "top",
                anim     : apf.tween.easeInOutCubic,
                from     : corrected ? corrected.from : -27,
                to       : corrected ? corrected.to : 6,
                steps    : 8,
                interval : 10,
                control  : (this.control = {}),
                onfinish : function() {
                    divSearchCount.$ext.style.visibility = "";
                    _self.updateCounter();
                    if (corrected && corrected.onfinish)
                        corrected.onfinish();
                }
            });
        }
        else if (winQuickSearch.visible) {
            var corrected = ide.dispatchEvent("ext.quicksearch.correctpos", {
                anim: "in"
            });

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
                    to       : corrected ? corrected.to : -30,
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

        // N.B. ace behavior: if you're already highlighting some text, another find executes
        // from the end of the cursor, not the start of your current highlight. thus,
        // if the text is "copyright" and you execute a search for "c", followed immediately by
        // "co", you'll never find the "co"--a search for "c" followed by a search for "o"
        // DOES work, but doesn't highlight the content, so it's kind of lame.
        // Let's reset the cursor in the doc whilst waiting for an Ace update

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
            var keyEl = apf.n("<word/>").attr("key", searchTxt).node();
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
        if (!editor || !editor.amlEditor)
            return;

        var amlEditor = editor.amlEditor;
        return amlEditor.$editor;
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
        commands.removeCommandByName("find");

        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
