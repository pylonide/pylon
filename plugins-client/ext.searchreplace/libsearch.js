/**
 * Search Helper Library for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var settings = require("core/settings");
var prefix   = "search/"

module.exports = {
    findKeyboardHandler : function(e, listName, txtFind, chkRegEx){
        switch (e.keyCode){
            case 27: //ESCAPE
                this.toggleDialog(-1);

                if (e.htmlEvent)
                    apf.stopEvent(e.htmlEvent);
                else if (e.stop)
                    e.stop();
                return false;
            case 38: //UP
                if (!this.hasCursorOnFirstLine(txtFind))
                    return;
                this.navigateList("prev", listName, txtFind, chkRegEx);
                return false;
            case 40: //DOWN
                if (!this.hasCursorOnLastLine(txtFind))
                    return;
                this.navigateList("next", listName, txtFind, chkRegEx);
                return false;
            case 36: //HOME
                if (!e.ctrlKey)
                    return;
                this.navigateList("first", listName, txtFind, chkRegEx);
                return false;
            case 35: //END
                if (!e.ctrlKey)
                    return;
                this.navigateList("last", listName, txtFind, chkRegEx);
                return false;
        }
    },
    
    hasCursorOnFirstLine : function(txtFind){
        var ace = txtFind.ace;
        return ace.getCursorPosition().row == 0;
    },
    
    hasCursorOnLastLine : function(txtFind){
        var ace = txtFind.ace;
        return ace.getCursorPosition().row != ace.session.getLength() - 1;
    },
    
    navigateList : function(type, listName, txtFind, chkRegEx){
        var model = settings.model;
        var lines = JSON.parse(model.queryValue(prefix + listName + "/text()") || "[]");
        
        var value = txtFind.getValue();
        if (value && (this.position == -1 || lines[this.position] != value)) {
            lines = this.saveHistory(value, listName);
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
            txtFind.select();
            this.position = next;
        }
    },
    
    saveHistory : function(searchTxt, listName){
        var settings = require("core/settings");
        if (!settings.model)
            return;

        var model = settings.model;
        var words = model.queryNodes(prefix + listName + "/word");
        
        //Cleanup of old format
        var search = words[0] && words[0].parentNode;
        for (var i = words.length - 1; i >= 0; i--) {
            search.removeChild(words[i]);
        }
        
        try {
            var json = JSON.parse(model.queryValue(prefix + listName + "/text()"));
        } catch(e) { json = [] }
        
        if (json[0] != searchTxt) {
            json.unshift(searchTxt);
            model.setQueryValue(prefix + listName + "/text()", JSON.stringify(json));
        }
        
        return json;
    },
    
    evaluateRegExp : function(txtFind, tooltip, win, e){
        var searchTxt = txtFind.getValue();
        try {
            new RegExp(searchTxt);
        } catch(e) {
            tooltip.$ext.innerHTML 
                = e.message.replace(": /" + searchTxt + "/", "");
            apf.setOpacity(tooltip.$ext, 1);
            
            var pos = apf.getAbsolutePosition(win.$ext);
            tooltip.$ext.style.left = txtFind.getLeft() + "px";
            tooltip.$ext.style.top = (pos[1] - 16) + "px";

            this.tooltipTimer = setTimeout(function(){
                tooltip.$ext.style.display = "block";
            }, 200);
            
            return false;
        }
        clearTimeout(this.tooltipTimer);
        tooltip.$ext.style.display = "none";
        
        return true;
    },
    
    initSingleLineEditor: function(apfEl) {
        // horrible hack
        apfEl.$input.contentEditable=false;
        apfEl.$input.innerHTML = "";
        var ace = this.$createSingleLineAceEditor(apfEl.$input);
        apfEl.$input.parentNode.style.cssText =
            ["-webkit-", "-khtml-", "-moz-", "-o-", ""].join("user-select: text;");
        apfEl.$input.style.textShadow = "none";
        
        // why are those in ace?
        ace.commands.removeCommands(["find", "replace", "replaceall", "gotoline"]);
        
        apfEl.ace = ace;
        ace.renderer.scroller.style.backgroundColor = "transparent";
        apfEl.ace = ace;
        apfEl.focus = apfEl.getValue = function() {
            return ace.focus();
        };
        apfEl.getValue = function() {
            return ace.session.getValue();
        };
        apfEl.setValue = function(val) {
            return ace.session.doc.setValue(val);
        };
        apfEl.select = function() {
            return ace.selectAll();
        };
    },
    $createSingleLineAceEditor: function(el) {
        var Editor = require("ace/editor").Editor;
        var UndoManager = require("ace/undomanager").UndoManager;
        var Renderer = require("ace/virtual_renderer").VirtualRenderer;
        var MultiSelect = require("ace/multi_select").MultiSelect;
        
        var renderer = new Renderer(el);
        el.style.overflow = "hidden";
        renderer.scrollBar.element.style.display = "none";
        renderer.scrollBar.width = 0;
        renderer.content.style.height = "auto";

        renderer.screenToTextCoordinates = function(x, y) {
            var pos = this.pixelToScreenCoordinates(x, y);
            return this.session.screenToDocumentPosition(
                Math.min(this.session.getScreenLength() - 1, Math.max(pos.row, 0)),
                Math.max(pos.column, 0)
            );
        };
        // todo size change event
        renderer.$computeLayerConfig = function() {
            var longestLine = this.$getLongestLine();
            var firstRow = 0;
            var lastRow = this.session.getLength();
            var height = this.session.getScreenLength() * this.lineHeight;

            this.scrollTop = 0;
            var config = this.layerConfig;
            config.width = longestLine;
            config.padding = this.$padding;
            config.firstRow = 0;
            config.firstRowScreen = 0;
            config.lastRow = lastRow;
            config.lineHeight = this.lineHeight;
            config.characterWidth = this.characterWidth;
            config.minHeight = height;
            config.maxHeight = height;
            config.offset = 0;
            config.height = height;

            this.$gutterLayer.element.style.marginTop = 0 + "px";
            this.content.style.marginTop = 0 + "px";
            this.content.style.width = longestLine + 2 * this.$padding + "px";
            this.content.style.height = height + "px";
            this.scroller.style.height = height + "px";
            this.container.style.height = height + "px";
        };
        renderer.isScrollableBy=function(){return false};

        var editor = new Editor(renderer);
        new MultiSelect(editor);
        editor.session.setUndoManager(new UndoManager());

        editor.setHighlightActiveLine(false);
        editor.setShowPrintMargin(false);
        editor.renderer.setShowGutter(false);
        editor.renderer.setHighlightGutterLine(false);
        return editor;
    },
    
    removeInputRegExp : function(txtFind){
        if (!txtFind.ace.regexp)
            return;
        txtFind.ace.regexp = false;
        txtFind.ace.session.bgTokenizer.tokenizer = {
            getLineTokens: function(val) {
                return {tokens: [{value: val, type: "text"}], state: ""}
            }
        }
    },
    
    updateInputRegExp : function(txtFind, e) {
        if (txtFind.ace.regexp)
            return;
        txtFind.ace.regexp = true;
        txtFind.ace.session.bgTokenizer.tokenizer = {
            getLineTokens: function(val) {
                return {tokens: module.exports.parseRegExp(val), state: ""}
            }
        }
        if (this.colorsAdded)
            return;
        this.colorsAdded = true;
        require("ace/lib/dom").importCssString("\
            .ace_r_collection {background:#ffc080;color:black}\
            .ace_r_escaped{color:#cb7824}\
            .ace_r_subescaped{background:#dbef5c;color:orange}\
            .ace_r_sub{background:#dbef5c;color:black;}\
            .ace_r_replace{background:#80c0ff;color:black}\
            .ace_r_range{background:#80c0ff;color:black}\
            .ace_r_modifier{background:#80c0ff;color:black}\
            .ace_r_error{background:red;color:white;",
            "ace_regexps"
        );
    },
    
    regexp : {
        alone : {"^":1, "$":1, ".":1},
        before : {"+":1, "*":1, "?":1},
        replace : /^\\[sSwWbBnrd]/,
        searches : /^\((?:\?\:|\?\!|\?|\?\=|\?\<\=)/,
        range : /^\{\s*\d+(\s*\,\s*\d+\s*)?\}/
    },

    //Calculate RegExp Colors
    parseRegExp : function(value){
        var re = this.regexp;
        var out   = [];
        var l, t, c, sub = 0, collection = 0;
        
        //This could be optimized if needed
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
                    out.push([t[0], "replace"]);
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
                if (sub == 0) {
                    out.push([")", "error"]);
                    value = value.substr(1);
                }
                else {
                    sub--;
                    out.push([")", "sub"]);
                    value = value.substr(1);
                }
                
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
                collection = 1;
                
                var ct, temp = ["{"];
                for (var i = 1, l = value.length; i < l; i++) {
                    ct = value.charAt(i);
                    temp.push(ct);
                    if (ct == "{")
                        collection++;
                    else if (ct == "}")
                        collection--;
                        
                    if (!collection)
                        break;
                }
                
                out.push([temp.join(""), "range"]);
                value = value.substr(temp.length);
                
                continue;
            }
            
            if (c == "]" || c == "}") {
                out.push([c, sub > 0 ? "sub" : "text"]);
                value = value.substr(1);
                
                continue;
            }
            
            if (re.before[c]) {
                var style, last = out[out.length - 1];
                if (!last)
                    style = "error";
                else if (last[1] == "text")
                    style = "replace";
                else {
                    var str = last[0];
                    var lastChar = str.charAt(str.length - 1);
                    if (lastChar == "(" || re.before[lastChar] 
                      || re.alone[lastChar] && lastChar != ".")
                        style = "error";
                    else
                        style = last[1];
                }
                
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
        
        // Process out ace token list
        var last = "text", res = [], token = {type: last, value: ""};
        for (var i = 0; i < out.length; i++) {
            if (out[i][1] != last) {
                token.value && res.push(token);
                last = out[i][1];
                token = {type: "r_" + last, value: ""}
            }
           token.value += out[i][0];
        }
        token.value && res.push(token);
        return res;
    },
}

});