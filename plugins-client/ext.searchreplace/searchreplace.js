/**
 * Searchreplace Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("core/settings");
var menus = require("ext/menus/menus");
var search = require("ace/search");
var editors = require("ext/editors/editors");
var css = require("text!ext/searchreplace/searchreplace.css");
var skin = require("text!ext/searchreplace/skin.xml");
var markup = require("text!ext/searchreplace/searchreplace.xml");
var commands = require("ext/commands/commands");
var tooltip = require("ext/tooltip/tooltip");
var libsearch = require("ext/searchreplace/libsearch");
var searchinfiles;

var oIter, oTotal;

//N.B. the problem is with many occurences, so a single character search breaks it.
var MAX_LINES = 20000; // alter live search if lines > 20k--performance bug
var MAX_LINES_SOFT = 8000; // single character search prohibited

module.exports = ext.register("ext/searchreplace/searchreplace", apf.extend({
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
        
        ide.addEventListener("init.ext/searchinfiles/searchinfiles", function(e){
            searchinfiles = e.ext;
        });
    },

    init : function(amlNode){
        var _self = this;
        
        ide.addEventListener("settings.load", function(e){
            e.ext.setDefaults("editors/code/search", [
                ["regex", "false"],
                ["matchcase", "false"],
                ["wholeword", "false"],
                ["backwards", "false"],
                ["wraparound", "true"],
                ["highlightmatches", "true"],
                ["preservecase", "false"]
            ]);
        });
        
        var isAvailable = commands.commands["findnext"].isAvailable;
        commands.commands["findnext"].isAvailable =
        commands.commands["findprevious"].isAvailable = function(editor){
            if (apf.activeElement == txtFind)
                return true;
            
            return isAvailable.apply(this, arguments);
        }
        
        commands.addCommand({
            name: "hidesearchreplace",
            bindKey: {mac: "ESC", win: "ESC"},
            isAvailable : function(editor){
                return winSearchReplace.visible;
            },
            exec: function(env, args, request) {
                _self.toggleDialog(-1);
            }
        });
        
        apf.importCssString(_self.css);
        
        ide.addEventListener("init.ext/console/console", function(e){
            mainRow.insertBefore(winSearchReplace, e.ext.splitter);
        });
        if (winSearchReplace.parentNode != mainRow) {
            mainRow.insertBefore(winSearchReplace, 
                self.winDbgConsole && winDbgConsole.previousSibling || null);
        }
               
        hboxReplace.addEventListener("afterrender", function(){
            var kb = _self.addSearchKeyboardHandler(txtReplace, "replace");
            kb.bindKeys({
                "Return": function(codebox) { _self.replace(); },
                "Shift-Return": function(codebox) { _self.replace(true); }
            });
            
            _self.decorateCheckboxes(this);
        });
        
        var blur = function(e) {
            if (self.hboxReplace && !hboxReplace.visible 
              && self.winSearchReplace && winSearchReplace.visible 
              && !apf.isChildOf(winSearchReplace, e.toElement))
                _self.toggleDialog(-1, null, true);
        }
        
        winSearchReplace.addEventListener("blur", blur);
        txtFind.addEventListener("blur", blur);
        
        document.body.appendChild(tooltipSearchReplace.$ext);
        
        chkRegEx.addEventListener("prop.value", function(e){
            _self.$setRegexpMode(txtFind, apf.isTrue(e.value));
        });
        
        this.decorateCheckboxes(hboxFind);

        this.addSearchKeyboardHandler(txtFind, "search");        
        txtFind.ace.session.on("change", function() {
            clearTimeout(_self.$timer);
            _self.$timer = setTimeout(function() { // chillax, then fire--necessary for rapid key strokes
                _self.execFind();
                apf.layout.forceResize();
                _self.updateCounter(null, true);
            }, 20);
        });
    },

    decorateCheckboxes : function(parent){
        var _self = this;
        
        var cbs = parent.getElementsByTagNameNS(apf.ns.aml, "checkbox");
        
        cbs.forEach(function(cb){
            cb.addEventListener("click", function(){
                _self.updateCounter(null, true);
                _self.execFind();
            });
            tooltip.add(cb.$ext, {
                message : cb.label,
                width : "auto",
                timeout : 0,
                tooltip : tooltipSearchReplace.$ext,
                animate : false,
                getPosition : function(){
                    var pos = apf.getAbsolutePosition(winSearchReplace.$ext);
                    var left = pos[0] + cb.getLeft();
                    var top = pos[1];
                    return [left, top - 16];
                }
            });
        });
    },
    
    updateCounter: function(backwards, updateOptions) {
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
                txtFind.$button.style.right = width + 45 + "px";
            }
        });

        if (updateOptions) {
            var options = this.getOptions();
            options.needle = txtFind.getValue();
            ace.$search.set(options);
        }

        var session = ace.session;
        var ranges = ace.$search.findAll(ace.session);
        if (!ranges || !ranges.length || !txtFind.getValue()) {
            oIter.innerHTML = "0";
            oTotal.innerHTML = "of 0";
            return;
        }

        /*@todo disable for now since update counter isn't called when no matches found
        clearTimeout(ace.$wordHighlightTimer);
        session.getMode().clearSelectionHighlight(ace);
        if (chkHighlightMatches.checked) {
            ranges.forEach(function(range) {
                var marker = session.addMarker(range, "ace_selected_word", "text");
                session.$selectionOccurrences.push(marker);
            });
        }*/

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
    
    toggleDialog: function(force, isReplace, noselect, callback) {
        var _self = this;

        ext.initExtension(this);
                
        var editor = editors.currentEditor;
        if (!editor || !editor.amlEditor)
            return;

        var wasVisible  = winSearchReplace.visible;
        var stateChange = isReplace != undefined && this.$lastState != isReplace;
        
        tooltipSearchReplace.$ext.style.display = "none";

        var animate = apf.isTrue(settings.model.queryValue("general/@animateui"));
        if (!force && !winSearchReplace.visible || force > 0 || stateChange) {
            if (winSearchReplace.visible && !stateChange) {
                txtFind.focus();
                txtFind.select();
                return;
            }
            
            if (searchinfiles && searchinfiles.inited && winSearchInFiles.visible) {
                ext.initExtension(this);
                winSearchInFiles.$ext.style.height = "0px";
                txtFind.focus();
                txtFind.select();
                
                searchinfiles.toggleDialog(-1, null, null, function() {
                    _self.toggleDialog(force, isReplace, noselect);
                });
                return;
            }
            
            winSearchReplace.$ext.style.overflow = "hidden";
            winSearchReplace.$ext.style.height = winSearchReplace.$ext.offsetHeight + "px";
            
            if (!animate || stateChange && isReplace || !wasVisible)
                this.setupDialog(isReplace);

            chkSearchSelection.uncheck();

            this.position = -1;

            if (!wasVisible) {
                var ace = this.$getAce();
                if (!ace.selection.isEmpty() && !ace.selection.isMultiLine())
                    txtFind.setValue(ace.getCopyText());
                this.startPos = {
                    range: ace.getSelectionRange(),
                    scrollTop: ace.session.getScrollTop(),
                    scrollLeft: ace.session.getScrollLeft()
                };
            }

            winSearchReplace.show();
            txtFind.focus();
            txtFind.select();
            
            //Animate
            var toHeight = winSearchReplace.$ext.scrollHeight;
            if (stateChange && !isReplace && wasVisible)
                toHeight -= hboxReplace.$ext.scrollHeight;
            
            if (animate) {
                Firmin.animate(winSearchReplace.$ext, {
                    height: toHeight + "px", //(isReplace ? 70 : 38)
                    timingFunction: "cubic-bezier(.10, .10, .25, .90)"
                }, 0.2, function() {
                    if (stateChange && !isReplace && wasVisible)
                        _self.setupDialog(isReplace);
                    
                    winSearchReplace.$ext.style[apf.CSSPREFIX + "TransitionDuration"] = "";
                    winSearchReplace.$ext.style.height = "";
                    
                    divSearchCount.$ext.style.visibility = "";
                    _self.updateCounter();
                    
                    setTimeout(function(){
                        apf.layout.forceResize();
                    }, 50);
                });
            }
            else {
                winSearchReplace.$ext.style.height = "";
                divSearchCount.$ext.style.visibility = "";
                _self.updateCounter();
                apf.layout.forceResize();
            }
        }
        else if (winSearchReplace.visible) {
            divSearchCount.$ext.style.visibility = "hidden";
            
            if (txtFind.getValue())
                _self.saveHistory(txtFind.getValue(), "search");
            
            winSearchReplace.visible = false;
            
            winSearchReplace.$ext.style.height 
                = winSearchReplace.$ext.offsetHeight + "px";

            //Animate
            if (animate) {
                Firmin.animate(winSearchReplace.$ext, {
                    height: "0px",
                    timingFunction: "ease-in-out"
                }, 0.2, function(){
                    winSearchReplace.visible = true;
                    winSearchReplace.hide();
                    
                    winSearchReplace.$ext.style[apf.CSSPREFIX + "TransitionDuration"] = "";
    
                    if (!noselect)
                        editor.ceEditor.focus();
                    
                    setTimeout(function(){
                        callback
                            ? callback()
                            : apf.layout.forceResize();
                    }, 50);
                });
            }
            else {
                winSearchReplace.visible = true;
                winSearchReplace.hide();
                if (!noselect)
                    editor.ceEditor.focus();
                
                callback
                    ? callback()
                    : apf.layout.forceResize();
            }
        }
        else if (callback)
            callback();
            
        return false;
    },
    
    restore : function() {
        if (!this.startPos)
            return false;
        var editor = this.$getAce();
        editor.selection.setSelectionRange(this.startPos.range);
        editor.session.setScrollTop(this.startPos.scrollTop);
        editor.session.setScrollLeft(this.startPos.scrollLeft);
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
        
        var sbox = hboxFind.childNodes[2];

        if (isReplace) {
            hboxReplace.show();
            var rbox = hboxReplace.childNodes[1];
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
        var options = {
            backwards: chkSearchBackwards.checked,
            wrap: chkWrapAround.checked,
            caseSensitive: chkMatchCase.checked,
            wholeWord: chkWholeWords.checked,
            regExp: chkRegEx.checked
        };
		
		if (chkSearchSelection.checked) {
			var range = this.startPos && (this.startPos.searchRange || this.startPos.range);
			if (range) {
				options.scope = search.Search.SELECTION;
				options.range = range;
			}			
		} else {
			options.scope = search.Search.ALL;
		}
		return options
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
        //chkSearchSelection.setAttribute("checked", false);
        this.updateCounter();
    },
    
    execFind: function(close, reverseBackwards, findNext, save) {
        var ace = this.$getAce();
        if (!ace)
            return;

        if (this.$timer)
            this.$timer = clearTimeout(this.$timer);

        var searchTxt = txtFind.getValue();
        if (searchTxt.length < 2 
          && ace.getSession().getLength() > MAX_LINES_SOFT)
            return;

        //@todo when highlight selection is available, this should change
        if (!save && chkSearchSelection.checked)
            return;

        var options = this.getOptions();
        if (reverseBackwards)
            options.backwards = !options.backwards;

        if (this.$crtSearch != searchTxt)
            this.$crtSearch = searchTxt;

        if (options.regExp
          && this.checkRegExp(txtFind, tooltipSearchReplace, winSearchReplace) === false)
            return;
        
        var range = ace.selection.getRange();
        
        if (options.backwards) {
            var range = ace.selection.getRange();
            
            ace.selection.moveCursorTo(
                range.start.row, 
                range.start.column);
            
            var opt = apf.extend({}, options);
            opt.backwards = false;
            ace.find(searchTxt, opt);
            var newRange = ace.selection.getRange();

            var foundAtRange = newRange.start.row == range.start.row 
              && newRange.start.column == range.start.column
              && (options.regex || newRange.end.row != range.end.row 
              || newRange.end.column != range.end.column);

            if (!foundAtRange || findNext) {
                ace.selection.moveCursorTo(
                  range.start.row, 
                  range.start.column);
                  
                ace.find(searchTxt, options);
            }
        }
        else {
            if (!findNext)
                ace.selection.moveCursorTo(range.start.row, range.start.column);
    
            ace.find(searchTxt, options);
        }
        
        this.currentRange = ace.selection.getRange();
        
        if (save) {
            this.saveHistory(searchTxt, "search");
            this.position = 0;
        }

        if (close) {
            winSearchReplace.hide();
            ace.focus();
        }

        this.updateCounter(options.backwards);
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

    replace: function(backwards) {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;
                
        var lut = {"n": "\n", "t": "\t", "r": "\r"};
        var strReplace = (txtReplace.getValue() || "")
            .replace(/(\\\\)+|\\([ntr])/g, function(m, m1, m2) { 
                return m1 || lut[m2];
            });
        
        this.$editor.insert(strReplace);
        //this.$editor.find(this.$crtSearch, options);
        this.findNext(backwards);
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
        
        var lut = {"n": "\n", "t": "\t", "r": "\r"};
        var strReplace = (txtReplace.getValue() || "")
            .replace(/(\\\\)+|\\([ntr])/g, function(m, m1, m2) { 
                return m1 || lut[m2];
            });
        
        this.$editor.replaceAll(strReplace, options);

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
}, libsearch));

});