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
    findKeyboardHandler : function(e, listName, txtFind){
        switch (e.keyCode){
            case 27: //ESCAPE
                this.toggleDialog(-1);

                if (e.htmlEvent)
                    apf.stopEvent(e.htmlEvent);
                else if (e.stop)
                    e.stop();
                return false;
            case 38: //UP
                if (!this.hasCursorOnFirstLine())
                    return;
                this.navigateList("prev", listName, txtFind);
                return false;
            case 40: //DOWN
                if (!this.hasCursorOnLastLine())
                    return;
                this.navigateList("next", listName, txtFind);
                return false;
            case 36: //HOME
                if (!e.ctrlKey)
                    return;
                this.navigateList("first", listName, txtFind);
                return false;
            case 35: //END
                if (!e.ctrlKey)
                    return;
                this.navigateList("last", listName, txtFind);
                return false;
        }
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
    
    navigateList : function(type, listName, txtFind){
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
            
            if (chkRegEx.checked)
                this.updateInputRegExp(txtFind);

            txtFind.select();
            delete txtFind.$undo;
            delete txtFind.$redo;
            
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
        this.updateInputRegExp(txtFind, e);
        
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
    
    removeInputRegExp : function(txtFind){
        txtFind.$input.innerHTML = txtFind.getValue();
        delete txtFind.$undo;
        delete txtFind.$redo;
    },
    
    updateInputRegExp : function(txtFind, e){
        // Find cursor position
        var selection = window.getSelection();
        var a = selection.anchorNode;
        if (!a) return;
        
        var value, pos;
        function getValuePos(){
            value = txtFind.getValue();
            
            var n = a.parentNode; 
            pos = a.nodeValue ? selection.anchorOffset : 0; 
            if (apf.isChildOf(txtFind.$input, n)) {
                while (n.previousSibling) {
                    n = n.previousSibling;
                    pos += (n.nodeType == 1 ? n.innerText : n.nodeValue).length;
                };
            }  
        }
        
        if (!txtFind.$undo) {
            getValuePos();
            txtFind.$undo = [[value, pos]];
            txtFind.$redo = [];
        }
        
        if (e) {
            var charHex = e.keyIdentifier.substr(2);
            var charDec = parseInt(charHex, 16);
            var isChangeKey = charDec == 8 || charDec == 127 || charDec > 31;
            
            if ((apf.isMac && e.metaKey || !apf.isMac && e.ctrlKey) && charDec == 90) {
                e.preventDefault();
                if (e.shiftKey) {
                    if (!txtFind.$redo.length)
                        return;
                    var undoItem = txtFind.$redo.pop();
                    value = undoItem[0];
                    pos = undoItem[1];
                    txtFind.$undo.push(undoItem);
                }
                else {
                    if (!txtFind.$undo.length)
                        return;
                    txtFind.$redo.push(txtFind.$undo.pop());
                    var undoItem = txtFind.$undo[txtFind.$undo.length - 1];
                    value = undoItem[0];
                    pos = undoItem[1];
                }
                isChangeKey = false;
            }
            else if (!isChangeKey || e.ctrlKey || e.metaKey)
                return;
            else {
                var wasRemoved = false;
                e.preventDefault();
                if (!selection.isCollapsed) {
                    wasRemoved = true;
                    selection.deleteFromDocument();
                }
                
                getValuePos();
            }
        }
        else {
            getValuePos();
        }
        
        if (isChangeKey) {
            //Backspace
            if (charDec == 8) {
                if (!wasRemoved) {
                    selection.deleteFromDocument();
                    value = value.substr(0, pos - 1) + value.substr(pos);
                    pos--;
                }
            }
            //Delete
            else if (charDec == 127) {
                if (!wasRemoved)
                    value = value.substr(0, pos) + value.substr(pos + 1);
            }
            //Normal chars
            else if (charDec > 31) {
                e.preventDefault();
                var key = JSON.parse('"\\u' + charHex + '"');
                if (!e.shiftKey)
                    key = key.toLowerCase();
                value = value.substr(0, pos) 
                    + key + value.substr(pos);
                pos++;
            }
            
            txtFind.$undo.push([value, pos]);
            txtFind.$redo = [];
        }
        
        // Set value
        txtFind.$input.innerHTML = this.parseRegExp(value);

        if (!value)
            return;
        
        // Set cursor position to previous location
        var el, idx, v;
        var n = txtFind.$input.firstChild;
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
        "subescaped" : "background:#dbef5c;color:orange",
        "sub" : "background:#dbef5c;color:black;",
        "replace" : "background:#80c0ff;color:black",
        "range" : "background:#80c0ff;color:black",
        "modifier" : "background:#80c0ff;color:black",
        "error" : "background:red;color:white;"
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
}

});