/**
 * quicksearch Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var canon = require("pilot/canon");
var editors = require("ext/editors/editors");
var Search = require("ace/search").Search;
var skin = require("text!ext/quicksearch/skin.xml");
var markup = require("text!ext/quicksearch/quicksearch.xml");

module.exports = ext.register("ext/quicksearch/quicksearch", {
    name    : "quicksearch",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    skin    : skin,
    markup  : markup,
    commands : {
        "quicksearch": {hint: "quickly search for a string inside the active document, without further options (see 'search')"},
        "find": {hint: "open the quicksearch dialog to quickly search for a phrase"},
        "findnext": {hint: "search for the next occurrence of the search query your entered last"},
        "findprevious": {hint: "search for the previous occurrence of the search query your entered last"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;
        canon.addCommand({
            name: "find",
            exec: function(env, args, request) {
                _self.toggleDialog(1);
            }
        });
    },

    init : function(amlNode){
        var _self = this;
        
        txtQuickSearch.addEventListener("keydown", function(e){
            switch (e.keyCode){
                case 13: //ENTER
                    if (e.shiftKey)
                        _self.execSearch(false, true);
                    else
                        _self.execSearch(false, false);
                    return false;
                break;
                case 27: //ESCAPE
                    _self.toggleDialog(-1);
                    if (e.htmlEvent)
                        apf.stopEvent(e.htmlEvent)
                    else if (e.stop)
                        e.stop();
                    return false;
                break;
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
        
        winQuickSearch.addEventListener("blur", function(e){
            if (!apf.isChildOf(winQuickSearch, e.toElement))
                _self.toggleDialog(-1);
        });
        
        var editor = editors.currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.parentNode.appendChild(winQuickSearch);
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
            txtQuickSearch.setValue(lines[next].getAttribute("key"));
            txtQuickSearch.select();
            this.position = next;
        }
    },
    
    handleQuicksearchEscape : function(e) {
        if (e.keyCode == 27)
            this.toggleDialog(-1);
    },

    toggleDialog: function(force) {
        ext.initExtension(this);

        if (this.control && this.control.stop)
            this.control.stop();

        var editorPage = tabEditors.getPage();
        if (!editorPage) return;

        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        if (!force && !winQuickSearch.visible || force > 0) {
            this.position = 0;
            
            var sel   = editor.getSelection();
            var doc   = editor.getDocument();
            var range = sel.getRange();
            var value = doc.getTextRange(range);
            
            if (!value && editor.ceEditor)
                value = editor.ceEditor.getLastSearchOptions().needle;
            
            if (value)
                txtQuickSearch.setValue(value);

            winQuickSearch.$ext.style.top = "-30px";
            winQuickSearch.show();
            txtQuickSearch.focus();
            txtQuickSearch.select();

            //Animate
            apf.tween.single(winQuickSearch, {
                type     : "top",
                anim     : apf.tween.easeInOutCubic,
                from     : -30,
                to       : 5,
                steps    : 8,
                interval : 10,
                control  : (this.control = {})
            });
        }
        else if (winQuickSearch.visible) {
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
                    winQuickSearch.hide();
                    editor.ceEditor.focus();
                }
            });
        }

        return false;
    },

    quicksearch : function(){
        this.toggleDialog(1);
    },

    execSearch: function(close, backwards) {
        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;
        
        var ceEditor = editor.ceEditor;
        var ace      = ceEditor.$editor;

        var txt = txtQuickSearch.getValue();
        if (!txt)
            return;

        var options = {
            backwards: backwards || false, 
            wrap: true, 
            caseSensitive: false, 
            wholeWord: false, 
            regExp: false, 
            scope: Search.ALL 
        };

        if (this.$crtSearch != txt) {
            this.$crtSearch = txt;
            ace.find(txt, options);
        }
        else {
            ace.find(txt, options);
        }
        
        var settings = require("ext/settings/settings");
        if (settings.model) {
            var history = settings.model;
            var search = apf.createNodeFromXpath(history.data, "search");
            
            if (!search.firstChild || search.firstChild.getAttribute("key") != txt) {
                var keyEl = apf.getXml("<word />");
                keyEl.setAttribute("key", txt);
                apf.xmldb.appendChild(search, keyEl, search.firstChild);
            }
        }
        
        if (close) {
            winQuickSearch.hide();
            ceEditor.focus();
        }
    },
    
    find: function() {
        this.toggleDialog(1);
        return false;
    },
    
    findnext: function() {
        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;
        
        var ceEditor = editor.ceEditor;
        var ace      = ceEditor.$editor;

        ace.findNext();
        return false;
    },
    
    findprevious: function() {
        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;
        
        var ceEditor = editor.ceEditor;
        var ace      = ceEditor.$editor;

        ace.findPrevious();
        return false;
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