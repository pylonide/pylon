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
    keyStroke: "",
    addSearchKeyboardHandler: function(txtFind, type) {
        var _self = this;
        var HashHandler = require("ace/keyboard/hash_handler").HashHandler;

        txtFind.ace.session.listName = type;
        var iSearchHandler = new HashHandler();
        iSearchHandler.bindKeys({
            "Up": function(codebox) {
                if (codebox.getCursorPosition().row > 0)
                    return false;

                _self.keyStroke = "next";
                _self.navigateList(_self.keyStroke, codebox);
                codebox.selection.moveCursorFileStart();
                codebox.selection.clearSelection();
            },
            "Down": function(codebox) {
                if (codebox.getCursorPosition().row < codebox.session.getLength() - 1)
                    return false;

                _self.keyStroke = "prev";
                _self.navigateList(_self.keyStroke, codebox);
                codebox.selection.lead.row = codebox.session.getLength() - 1;
            },
            "Ctrl-Home":  function(codebox) { _self.keyStroke = "prev"; _self.navigateList("first", codebox); },
            "Ctrl-End": function(codebox) {   _self.keyStroke = "next"; _self.navigateList("last", codebox);  },
            "Esc": function() { _self.toggleDialog(-1);},
            "Shift-Esc|Ctrl-Esc": function() { _self.restore(); },
            "Ctrl-Return|Alt-Return": function(codebox) { codebox.insert("\n");},
            "Return": function(codebox) {
                _self.saveHistory(codebox.session.getValue());
                _self.execFind(false, false, true, true);
            },
            "Shift-Return": function(codebox) {
                _self.saveHistory(codebox.session.getValue());
                _self.execFind(false, true, true, true);
            }
        });

        iSearchHandler.handleKeyboard = function(data, hashId, keyString, keyCode) {
            if (keyString == "\x00")
                return;
            var command = this.findKeyCommand(hashId, keyString);
            var editor = data.editor;
            if (!command)
                return;

            var success = command.exec(editor);
            if (success != false)
                return {command: "null"};
        };
        txtFind.ace.setKeyboardHandler(iSearchHandler);
        return iSearchHandler;
    },

    navigateList : function(type, codebox){
        var listName = codebox.session.listName;
        var model = settings.model;
        var lines = JSON.parse(model.queryValue(prefix + listName + "/text()") || "[]");

        var value = codebox.getValue();
        if (value && (this.position == -1 || lines[this.position] != value)) {
            lines = this.saveHistory(value, listName);
            this.position = 0;
        }

        var next;
        if (type == "prev") {
            if (this.position <= 0) {
                codebox.setValue("");
                this.keyStroke = "";
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
            codebox.setValue(lines[next], true);
            this.keyStroke = "";
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

        var json;
        try {
            json = JSON.parse(model.queryValue(prefix + listName + "/text()"));
        }
        catch(e) {
            json = [];
        }

        if (json[0] != searchTxt) {
            json.unshift(searchTxt);
            model.setQueryValue(prefix + listName + "/text()", JSON.stringify(json));
        }

        return json;
    },

    checkRegExp : function(txtFind, tooltip, win){
        var searchTxt = txtFind.getValue();
        try {
            new RegExp(searchTxt);
        }
        catch(e) {
            tooltip.$ext.innerHTML = apf.escapeXML(e.message.replace(": /" + searchTxt + "/", ""));
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

    $setRegexpMode : function(txtFind, isRegexp) {
        var tokenizer = {};
        tokenizer.getLineTokens = isRegexp
            ? function(val) { return {tokens: module.exports.parseRegExp(val), state: ""}; }
            : function(val) { return {tokens: [{value: val, type: "text"}], state: ""}; };

        txtFind.ace.session.bgTokenizer.tokenizer = tokenizer;
        txtFind.ace.session.bgTokenizer.lines = [];
        txtFind.ace.renderer.updateFull();

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
        rangeStart : {"+":1, "*":1, "?":1, "{":1},
        replace : /^\\[sSwWbBnrd]/,
        searches : /^\((?:\?\:|\?\!|\?|\?\=|\?\<\=)/,
        range : /^([+*?]|\{(\d+,\d+|\d+,?|,?\d+)\})\??|^[$\^]/
    },

    //Calculate RegExp Colors
    parseRegExp : function(value){
        var re = this.regexp;
        var l, t, c, sub = 0, collection = 0;
        var out = [];
        var push = function(text, type) {
            if (typeof text == "number")
                text = value.substr(0, text);
            out.push(text, type);
            value = value.substr(text.length);
        };

        //This could be optimized if needed
        while (value.length) {
            if ((c = value.charAt(0)) == "\\") {
                // \\ detection
                if (t = value.match(/^\\\\+/g)) {
                    var odd = ((l = t[0].length) % 2);
                    push([l - odd, sub > 0 ? "subescaped" : "escaped"]);
                    continue;
                }

                // Replacement symbols
                if (t = value.match(re.replace)) {
                    push(t[0], "replace");
                    continue;
                }

                // \uXXXX
                if (t = value.match(/^\\(?:(u)\d{0,4}|(x)\d{0,2})/)) {
                    var isError = (t[1] == "u" && t[0].length != 6)
                        || (t[1] == "x" && t[0].length != 4);
                    push(t[0], isError ? "error" : "escaped");
                    continue;
                }

                // Escaped symbols
                push(2, "escaped");
                continue;
            }

            if (c == "|") {
                push(c, "collection");
                continue;
            }

            // Start Sub Matches
            if (c == "(") {
                sub++;
                t = value.match(re.searches);
                if (t) {
                    push(t[0], "sub");
                    continue;
                }

                push("(", "sub");
                continue;
            }

            // End Sub Matches
            if (c == ")") {
                if (sub === 0) {
                    out.push([")", "error"]);
                    value = value.substr(1);
                }
                else {
                    sub--;
                    push(")", "sub");
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

                push(temp.join(""), "collection");
                continue;
            }

            if (c == "]" || c == "}") {
                push(c, sub > 0 ? "sub" : "text");
                continue;
            }

            // Ranges
            if (re.rangeStart[c]) {
                var m = value.match(re.range);
                if (!m) {
                    push(c, "text");
                    continue;
                }
                push(m[0], "range");
                // double quantifier is an error
                m = value.match(re.range);
                if (m) {
                    push(m[0], "error");
                    continue;
                }
                continue;
            }

            if (re.alone[c]) {
                push(c, "replace");
                if (c == ".")
                    continue;
                var m = value.match(re.range);
                if (m) {
                    push(m[0], "error");
                    continue;
                }
            }

            // Just Text
            push(c, sub > 0 ? "sub" : "text");
        }

        // Process out ace token list
        var last = "text", res = [], token = {type: last, value: ""};
        for (var i = 0; i < out.length; i+=2) {
            if (out[i+1] != last) {
                token.value && res.push(token);
                last = out[i+1];
                token = {type: "r_" + last, value: ""};
            }
           token.value += out[i];
        }
        token.value && res.push(token);
        return res;
    }
};

});