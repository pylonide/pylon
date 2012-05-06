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
var settings = require("core/settings");
var menus = require("ext/menus/menus");
var search = require("ace/search");
var editors = require("ext/editors/editors");
var css = require("text!ext/searchreplace/searchreplace.css");
var skin = require("text!ext/searchreplace/skin.xml");
var markup = require("text!ext/searchreplace/searchreplace.xml");
var commands = require("ext/commands/commands");
var tooltip = require("ext/tooltip/tooltip");

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
            mainRow.insertBefore(winSearchReplace, winDbgConsole);
        });
        if (winSearchReplace.parentNode != mainRow)
            mainRow.insertBefore(winSearchReplace, self.winDbgConsole || null);
        
        txtFind.addEventListener("clear", function() {
            _self.execSearch(false, false, true);
        })

        txtFind.addEventListener("keydown", function(e) {
            switch (e.keyCode){
                case 13: //ENTER
                    if (e.altKey || e.shiftKey || e.ctrlKey)
                        return;
                    _self.execSearch(false, !!e.shiftKey, null, true);
                    return false;
                case 27: //ESCAPE
                    _self.toggleDialog(-1);

                    if (e.htmlEvent)
                        apf.stopEvent(e.htmlEvent);
                    else if (e.stop)
                        e.stop();
                    return false;
                case 38: //UP
                    if (!_self.hasCursorOnFirstLine())
                        return;
                    _self.navigateList("prev");
                    return false;
                case 40: //DOWN
                    if (!_self.hasCursorOnLastLine())
                        return;
                    _self.navigateList("next");
                    return false;
                case 36: //HOME
                    if (!e.ctrlKey)
                        return;
                    _self.navigateList("first");
                    return false;
                case 35: //END
                    if (!e.ctrlKey)
                        return;
                    _self.navigateList("last");
                    return false;
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
        
        var blur = function(e){
            if (self.hboxReplace && !hboxReplace.visible 
              && self.winSearchReplace && winSearchReplace.visible 
              && !apf.isChildOf(winSearchReplace, e.toElement))
                _self.toggleDialog(-1, null, true);
        }
        winSearchReplace.addEventListener("blur", blur);
        txtFind.addEventListener("blur", blur);
        //txtReplace.addEventListener("blur", blur);
        
        var tt = document.body.appendChild(tooltipSearchReplace.$ext);
        
        chkRegEx.addEventListener("prop.value", function(e){
            if (apf.isTrue(e.value)) {
                if (txtFind.getValue())
                    _self.updateInputRegExp();
            }
            else
                txtFind.$input.innerHTML = txtFind.getValue();
        });
        
        var cbs = winSearchReplace.getElementsByTagNameNS(apf.ns.aml, "checkbox");
        cbs.forEach(function(cb){
            tooltip.add(cb.$ext, {
                message : cb.label,
                width : "auto",
                timeout : 0,
                tooltip : tt,
                animate : false,
                getPosition : function(){
                    var pos = apf.getAbsolutePosition(winSearchReplace.$ext);
                    var left = pos[0] + cb.getLeft();
                    var top = pos[1];
                    return [left, top - 19];
                }
            });
        });
    },
    
    hasCursorOnFirstLine : function(){
        var selection = window.getSelection();
        if (selection.anchorNode.nodeType == 1)
            return true;
        
        var n = selection.anchorNode.parentNode;
        if (selection.anchorNode.nodeValue.substr(0, selection.anchorOffset).indexOf("\n") > -1)
            return false;

        if (apf.isChildOf(txtFind.$input, n)) {
            while (n.previousSibling) {
                n = n.previousSibling;
                if ((n.nodeType == 1 ? n.innerText : n.nodeValue).indexOf("\n") > -1)   
                    return false;
            };
        }
        
        return true;
    },
    
    hasCursorOnLastLine : function(){
        var selection = window.getSelection();
        if (selection.anchorNode.nodeType == 1)
            return true;
        
        var n = selection.anchorNode.parentNode;
        if (selection.anchorNode.nodeValue.substr(selection.anchorOffset).indexOf("\n") > -1)
            return false;

        if (apf.isChildOf(txtFind.$input, n)) {
            while (n.nextSibling) {
                n = n.nextSibling;
                if ((n.nodeType == 1 ? n.innerText : n.nodeValue).indexOf("\n") > -1)   
                    return false;
            };
        }
        
        return true;
    },
    
    navigateList : function(type){
        var model = settings.model;
        var lines = JSON.parse(model.queryValue("search/text()") || "[]");
        
        var value = txtFind.getValue();
        if (value && (this.position == -1 || lines[this.position] != value)) {
            this.saveHistory(value);
            this.position = 0;
        }

        var next;
        if (type == "prev") {
            if (this.position <= 0) {
                txtFind.setValue("");
                this.position = -1;
                return;
            }
            next = Math.max(0, this.position - 1);
        }
        else if (type == "next")
            next = Math.min(lines.length - 1, this.position + 1);
        else if (type == "last")
            next = Math.max(lines.length - 1, 0);
        else if (type == "first")
            next = 0;

        if (lines[next] && next != this.position) {
            txtFind.setValue(lines[next]);
            
            if (chkRegEx.checked)
                this.updateInputRegExp();

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
    
    toggleDialog: function(force, isReplace, noselect) {
        var _self = this;
        
        ext.initExtension(this);

        var editor = editors.currentEditor;
        if (!editor || !editor.amlEditor)
            return;

        var stateChange = isReplace != undefined && this.$lastState != isReplace;
        
        tooltipSearchReplace.$ext.style.display = "none";

        if (!force && !winSearchReplace.visible || force > 0 || stateChange) {
            if (winSearchReplace.visible && !stateChange) {
                txtFind.focus();
                txtFind.select();
                return;
            }
            
            winSearchReplace.$ext.style.overflow = "hidden";
            winSearchReplace.$ext.style.height 
                = winSearchReplace.$ext.offsetHeight + "px";
            
            if (stateChange && isReplace)
                this.setupDialog(isReplace);

            chkSearchSelection.uncheck();

            this.position = -1;

            var sel   = editor.getSelection();
            var doc   = editor.getDocument();
            var range = sel.getRange();
            var value = doc.getTextRange(range);

            if (value) {
                txtFind.setValue(value);
                
                if (chkRegEx.checked)
                    this.updateInputRegExp();
            }

            winSearchReplace.show();
            txtFind.focus();
            txtFind.select();
            
            winSearchReplace.$ext.scrollTop = 0;
            document.body.scrollTop = 0;
            
            //Animate
            Firmin.animate(winSearchReplace.$ext, {
                height: (isReplace ? 70 : 38) + "px",
                timingFunction: "cubic-bezier(.10, .10, .25, .90)"
            }, 0.2, function() {
                if (stateChange && !isReplace)
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
        else if (winSearchReplace.visible) {
            divSearchCount.$ext.style.visibility = "hidden";
            
            if (txtFind.getValue())
                _self.saveHistory(txtFind.getValue());
            
            winSearchReplace.visible = false;
            
            winSearchReplace.$ext.style.height 
                = winSearchReplace.$ext.offsetHeight + "px";

            //Animate
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
                    apf.layout.forceResize();
                }, 50);
            });
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
        
        if (options.regExp) {
            this.updateInputRegExp();
            
            try {
                new RegExp(searchTxt);
            } catch(e) {
                tooltipSearchReplace.$ext.innerHTML 
                    = e.message.replace(": /" + searchTxt + "/", "");
                apf.setOpacity(tooltipSearchReplace.$ext, 1);
                
                var pos = apf.getAbsolutePosition(winSearchReplace.$ext);
                tooltipSearchReplace.$ext.style.left = txtFind.getLeft() + "px";
                tooltipSearchReplace.$ext.style.top = (pos[1] - 19) + "px";

                this.tooltipTimer = setTimeout(function(){
                    tooltipSearchReplace.$ext.style.display = "block";
                }, 200);
                
                return;
            }
            clearTimeout(this.tooltipTimer);
            tooltipSearchReplace.$ext.style.display = "none";
        }

        ace.find(searchTxt, options);
        this.currentRange = ace.selection.getRange();

        if (save) {
            this.saveHistory(searchTxt);
            this.position = 0;
        }

        if (close) {
            winSearchReplace.hide();
            editors.currentEditor.amlEditor.focus();
        }

        this.updateCounter(backwards);
    },
    
    updateInputRegExp : function(){
        if (!txtFind.getValue())
            return;
        
        // Find cursor position
        var selection = window.getSelection();
        var n = selection.anchorNode.parentNode; 
        var pos = selection.anchorOffset; 
        if (apf.isChildOf(txtFind.$input, n)) {
            while (n.previousSibling) {
                n = n.previousSibling;
                pos += (n.nodeType == 1 ? n.innerText : n.nodeValue).length;
            };
        }
        
        var value = txtFind.getValue();
        
        // Set value
        txtFind.$input.innerHTML = this.parseRegExp(value);
        
        // Set cursor position to previous location
        var el, idx, v;
        n = txtFind.$input.firstChild;
        while (n) {
            v = n.nodeType == 1 ? n.innerText : n.nodeValue;
            if (pos - v.length <= 0) {
                el = n;
                idx = pos;
                break;
            }
            else {
                pos -= v.length;
                n = n.nextSibling;
            }
        };
        
        if (el.nodeType == 1)
            el = el.firstChild;
        
        var range = document.createRange();
        range.setStart(el, idx);
        range.setEnd(el, idx);
        
        selection.removeAllRanges();
        selection.addRange(range);
    },
    
    regexp : {
        alone : {"^":1, "$":1, ".":1},
        before : {"+":1, "*":1, "?":1},
        replace : /^\\[sSwWbBnrd]/,
        searches : /^\((?:\?\:|\?\!|\?|\?\=|\?\<\=)/,
        range : /^\{\s*\d+(\s*\,\s*\d+\s*)?\}/
    },
    
    regColor : {
        "text" : "color:black",
        "collection" : "background:#ffc080;color:black",
        "escaped" : "color:#cb7824",
        "subescaped" : "background:#00c066;color:orange",
        "sub" : "background:#00c000;color white",
        "replace" : "background:#80c0ff;color:black",
        "range" : "background:#80c0ff;color:black",
        "modifier" : "background:#80c0ff;color:black",
    },
    
    parseRegExp : function(value){
        
        //Calculate RegExp Colors
        var re = this.regexp;
        var out   = [];
        var l, t, c, sub = 0, collection = 0;
        
        while (value.length) {
            if ((c = value.charAt(0)) == "\\") {
                // \\ detection
                if (t = value.match(/^\\\\+/g)) {
                    var odd = ((l = t[0].length) % 2);
                    out.push([value.substr(0, l - odd), 
                        sub > 0 ? "subescaped" : "escaped"]);
                    value = value.substr(l - odd);
                    
                    continue;
                }
                
                // Replacement symbols
                if (t = value.match(re.replace)) {
                    out.push([t, "replace"]);
                    value = value.substr(2);
                    
                    continue;
                }
                
                // Escaped symbols
                out.push([value.substr(0, 2), "escaped"]);
                value = value.substr(2);
                
                continue;
            }
            
            // Start Sub Matches
            if (c == "(") {
                sub++;
                t = value.match(re.searches);
                if (t) {
                    out.push([value.substr(0, t[0].length), "sub"]);
                    value = value.substr(t[0].length);
                    
                    continue;
                }
                
                out.push(["(", "sub"]);
                value = value.substr(1);
                
                continue;
            }
            
            // End Sub Matches
            if (c == ")") {
                sub--;
                out.push([")", "sub"]);
                value = value.substr(1);
                
                continue;
            }
            
            // Collections
            if (c == "[") {
                collection = 1;
                
                var ct, temp = ["["];
                for (var i = 1, l = value.length; i < l; i++) {
                    ct = value.charAt(i);
                    temp.push(ct);
                    if (ct == "[")
                        collection++;
                    else if (ct == "]")
                        collection--;
                        
                    if (!collection)
                        break;
                }
                
                out.push([temp.join(""), "collection"]);
                value = value.substr(temp.length);
                
                continue;
            }
            
            // Ranges
            if (c == "{") {
                var ct = value.match(re.range);
                if (ct) {
                    out.push([ct[0], "range"]);
                    value = value.substr(ct[0].length);
                }
                else {
                    out.push(["{", "range"]);
                    value = value.substr(1);
                }
                
                continue;
            }
            
            if (re.before[c]) {
                var style = (out[out.length - 1] || {})[1] || "modifier";
                if (style == "text") style == "replace";
                out.push([c, style]);
                value = value.substr(1);
                
                continue;
            }
            
            if (re.alone[c]) {
                out.push([c, "replace"]);
                value = value.substr(1);
                
                continue;
            }
            
            // Just Text
            out.push([c, sub > 0 ? "sub" : "text"]);
            value = value.substr(1)
        }
        
        // Process out
        var last = "text", res = [], color = this.regColor;
        for (var i = 0; i < out.length; i++) {
            if (out[i][1] != last) {
                last = out[i][1];
                res.push("</span><span style='" + color[last] + "'>");
            }
            res.push(out[i][0]);
        }
        
        return ("<span>" + res.join("") + "</span>").replace(/<span><\/span>/g, "");
    },

    saveHistory : function(searchTxt){
        var settings = require("ext/settings/settings");
        if (!settings.model)
            return;

        var model = settings.model;
        var words = model.queryNodes("search/word");
        
        //Cleanup of old format
        var search = words[0] && words[0].parentNode;
        for (var i = words.length - 1; i >= 0; i--) {
            search.removeChild(words[i]);
        }
        
        try {
            var json = JSON.parse(model.queryValue("search/text()"));
        } catch(e) { json = [] }
        
        if (json[0] != searchTxt) {
            json.unshift(searchTxt);
            model.setQueryValue("search/text()", JSON.stringify(json));
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