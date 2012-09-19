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
            var command = this.findKeyCommand(hashId, keyString)
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

        try {
            var json = JSON.parse(model.queryValue(prefix + listName + "/text()"));
        } catch(e) { json = [] }

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
        } catch(e) {
            tooltip.$ext.innerHTML
                = apf.escapeXML(e.message.replace(": /" + searchTxt + "/", ""));
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

                // \uXXXX
                if (t = value.match(/^\\(?:(u)\d{0,4}|(x)\d{0,2})/)) {
                    var isError = (t[1] == "u" && t[0].length != 6)
                        || (t[1] == "x" && t[0].length != 4);
                    out.push([t[0], isError ? "error" : "escaped"]);
                    value = value.substr(t[0].length);

                    continue;
                }

                // Escaped symbols
                out.push([value.substr(0, 2), "escaped"]);
                value = value.substr(2);

                continue;
            }

            if (c == "|") {
                value = value.substr(1);
                out.push([c, "collection"]);

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
    }
}

});