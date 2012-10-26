/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

/*global txtCompleter txtCompleterDoc txtCompleterHolder barCompleterCont
  ceEditor sbCompleter*/

var ide = require("core/ide");
var editors = require("ext/editors/editors");
var dom = require("ace/lib/dom");
var keyhandler = require("ext/language/keyhandler");

var lang = require("ace/lib/lang");
var language;
var complete;

var oldCommandKey, oldOnTextInput;
var isDocShown;

var ID_REGEX = /[a-zA-Z_0-9\$\_]/;
var CLASS_SELECTED = "cc_complete_option selected";
var CLASS_UNSELECTED = "cc_complete_option";
var SHOW_DOC_DELAY = 1500;
var SHOW_DOC_DELAY_MOUSE_OVER = 100;
var HIDE_DOC_DELAY = 1000;
var AUTO_OPEN_DELAY = 200;
var AUTO_UPDATE_DELAY = 200;
var CRASHED_COMPLETION_TIMEOUT = 6000;
var MENU_WIDTH = 330;
var MENU_SHOWN_ITEMS = 9;
var EXTRA_LINE_HEIGHT = 3;
var deferredInvoke = lang.deferredCall(function() {
    var editor = editors.currentEditor.ceEditor.$editor;
    var pos = editor.getCursorPosition();
    var line = editor.getSession().getDocument().getLine(pos.row);
    if (keyhandler.preceededByIdentifier(line, pos.column) ||
       (line[pos.column - 1] === '.' && (!line[pos.column] || !line[pos.column].match(ID_REGEX))) ||
       keyhandler.isRequireJSCall(line, pos.column)) {
        module.exports.invoke(true);
    }
    else {
        module.exports.closeCompletionBox();
    }
    isInvokeScheduled = false;
});
var isInvokeScheduled = false;
var ignoreMouseOnce = false;

var drawDocInvoke = lang.deferredCall(function() {
    if (isPopupVisible() && complete.matches[complete.selectedIdx].doc) {
        isDocShown = true;
        txtCompleterDoc.parentNode.show();
    }
    isDrawDocInvokeScheduled = false;
});
var isDrawDocInvokeScheduled = false;

var undrawDocInvoke = lang.deferredCall(function() {
    if (!isPopupVisible()) {
        isDocShown = false;
        txtCompleterDoc.parentNode.hide();
    }
});

var killCrashedCompletionInvoke = lang.deferredCall(function() {
    complete.closeCompletionBox();
});

function isPopupVisible() {
    return barCompleterCont.$ext.style.display !== "none";
}

function retrievePreceedingIdentifier(text, pos) {
    var buf = [];
    for(var i = pos-1; i >= 0; i--) {
        if(ID_REGEX.test(text[i]))
            buf.push(text[i]);
        else
            break;
    }
    return buf.reverse().join("");
}

function retrieveFollowingIdentifier(text, pos) {
    var buf = [];
    for (var i = pos; i < text.length; i++) {
        if (ID_REGEX.test(text[i]))
            buf.push(text[i]);
        else
            break;
    }
    return buf;
}

function isJavaScript() {
    return editors.currentEditor.amlEditor.syntax === "javascript";
}

/**
 * Replaces the preceeding identifier (`prefix`) with `newText`, where ^^
 * indicates the cursor position after the replacement.
 * If the prefix is already followed by an identifier substring, that string
 * is deleted.
 */
function replaceText(editor, prefix, match) {
    var newText = match.replaceText;
    var pos = editor.getCursorPosition();
    var line = editor.getSession().getLine(pos.row);
    var doc = editor.getSession().getDocument();
    
    if (match.replaceText === "require(^^)" && isJavaScript()) {
        newText = "require(\"^^\")";
        if (!isInvokeScheduled)
            setTimeout(deferredInvoke, AUTO_OPEN_DELAY);
        isInvokeScheduled = true;
    }   
    
    // Ensure cursor marker
    if (newText.indexOf("^^") === -1)
        newText += "^^";

    // Find prefix whitespace of current line
    for (var i = 0; i < line.length && (line[i] === ' ' || line[i] === "\t");)
        i++;
    
    var prefixWhitespace = line.substring(0, i);
    
    var postfix = retrieveFollowingIdentifier(line, pos.column) || "";
    
    // Pad the text to be inserted
    var paddedLines = newText.split("\n").join("\n" + prefixWhitespace);
    var splitPaddedLines = paddedLines.split("\n");
    var colOffset;
    for (var rowOffset = 0; rowOffset < splitPaddedLines.length; rowOffset++) {
        colOffset = splitPaddedLines[rowOffset].indexOf("^^");
        if (colOffset !== -1)
            break;
    }
    // Remove cursor marker
    paddedLines = paddedLines.replace("^^", "");
    
    doc.removeInLine(pos.row, pos.column - prefix.length, pos.column + postfix.length);
    doc.insert({row: pos.row, column: pos.column - prefix.length}, paddedLines);
    
    var cursorCol = pos.column + colOffset - prefix.length;
    
    if (line.substring(0, pos.column).match(/require\("[^\"]+$/) && isJavaScript()) {
        if (line.substr(pos.column + postfix.length, 1).match(/['"]/) || paddedLines.substr(0, 1) === '"')
            cursorCol++;
        if (line.substr(pos.column + postfix.length + 1, 1) === ')')
            cursorCol++;
    }
    var cursorPos = { row: pos.row + rowOffset, column: cursorCol };
    editor.selection.setSelectionRange({ start: cursorPos, end: cursorPos });
}

var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");

module.exports = {
    hook: function(ext, worker) {
        var _self = complete = this;
        language = ext;
        worker.on("complete", function(event) {
            if(ext.disabled) return;
            _self.onComplete(event);
        });
        this.$onChange = this.onChange.bind(this);
        
        ext.nodes.push(
            menus.addItemByPath("Edit/~", new apf.divider(), 2000),
            menus.addItemByPath("Edit/Show Autocomplete", new apf.item({
                command : "complete"
            }), 2100)
        );
        
        commands.addCommand({
            name: "complete",
            hint: "code complete",
            bindKey: {mac: "Ctrl-Space|Alt-Space", win: "Ctrl-Space|Alt-Space"},
            isAvailable : function(editor){
                return apf.activeElement.localName == "codeeditor";
            },
            exec: function(editor) {
                _self.invoke();
            }
        });
        
        this.ext = ext;
    },
    
    showCompletionBox: function(matches, prefix) {
        var _self = this;
        this.editor = editors.currentEditor;
        var ace = this.editor.amlEditor.$editor;
        this.selectedIdx = 0;
        this.scrollIdx = 0;
        this.matchEls = [];
        this.prefix = prefix;
        this.matches = matches;
        this.completionElement = txtCompleter.$ext;
        this.docElement = txtCompleterDoc.$ext;
        this.cursorConfig = ace.renderer.$cursorLayer.config;
        this.lineHeight = this.cursorConfig.lineHeight + EXTRA_LINE_HEIGHT;
        var style = dom.computedStyle(this.editor.amlEditor.$ext);
        this.completionElement.style.fontSize = style.fontSize;
        
        barCompleterCont.setAttribute('visible', true);

        // Monkey patch
        if(!oldCommandKey) {
            oldCommandKey = ace.keyBinding.onCommandKey;
            ace.keyBinding.onCommandKey = this.onKeyPress.bind(this);
            oldOnTextInput = ace.keyBinding.onTextInput;
            ace.keyBinding.onTextInput = this.onTextInput.bind(this);
        }
        
        this.populateCompletionBox(matches);
        document.addEventListener("click", this.closeCompletionBox);
        ace.container.addEventListener("DOMMouseScroll", this.closeCompletionBox);
        ace.container.addEventListener("mousewheel", this.closeCompletionBox);
        
        apf.popup.setContent("completionBox", barCompleterCont.$ext);
        var boxLength = this.matches.length || 1;
        var completionBoxHeight = 11 + Math.min(10 * this.lineHeight, boxLength * (this.lineHeight));
        var cursorLayer = ace.renderer.$cursorLayer;
        
        var innerBoxLength = this.matches.length || 1;
        var innerCompletionBoxHeight = Math.min(10 * this.lineHeight, innerBoxLength * (this.lineHeight));
        txtCompleterHolder.$ext.style.height = innerCompletionBoxHeight + "px";
        
        ignoreMouseOnce = !isPopupVisible();
        
        apf.popup.show("completionBox", {
            x        : (prefix.length * -_self.cursorConfig.characterWidth) - 11,
            y        : _self.cursorConfig.lineHeight,
            height   : completionBoxHeight,
            width    : MENU_WIDTH,
            animate  : false,
            ref      : cursorLayer.cursor,
            callback : function() {
                barCompleterCont.setHeight(completionBoxHeight);
                barCompleterCont.$ext.style.height = completionBoxHeight + "px";
                sbCompleter.$resize();
                // HACK: Need to set with non-falsy value first
                _self.completionElement.scrollTop = 1;
                _self.completionElement.scrollTop = 0;
            }
        });
    },

    closeCompletionBox : function(event) {
        barCompleterCont.$ext.style.display = "none";
        if (!editors.currentEditor.amlEditor) // no editor, try again later
            return;
        var ace = editors.currentEditor.amlEditor.$editor;
        document.removeEventListener("click", this.closeCompletionBox);
        ace.container.removeEventListener("DOMMouseScroll", this.closeCompletionBox);
        ace.container.removeEventListener("mousewheel", this.closeCompletionBox);
        
        if(oldCommandKey) {
            ace.keyBinding.onCommandKey = oldCommandKey;
            ace.keyBinding.onTextInput = oldOnTextInput;
        }
        oldCommandKey = oldOnTextInput = null;
        undrawDocInvoke.schedule(HIDE_DOC_DELAY);
    },
        
    populateCompletionBox: function (matches) {
        var _self = this;
        _self.completionElement.innerHTML = "";
        var cursorConfig = ceEditor.$editor.renderer.$cursorLayer.config;
        var hasIcons = false;
        matches.forEach(function(match) {
            if (match.icon)
                hasIcons = true;
        });
        var isInferAvailable = language.isInferAvailable();
        matches.forEach(function(match, idx) {
            var matchEl = dom.createElement("div");
            matchEl.className = idx === _self.selectedIdx ? CLASS_SELECTED : CLASS_UNSELECTED;
            var html = "";
            
            if (match.icon)
                html = "<img src='" + ide.staticPrefix + "/ext/language/img/" + match.icon + ".png'/>";
            
            var docHead;
            if (match.type) {
                var shortType = _self.$guidToShortString(match.type)
                if (shortType) {
                    match.meta = shortType;
                    docHead = match.name + " : " + _self.$guidToLongString(match.type) + "</div>";
                }
            }
            
            var trim = match.meta ? " maintrim" : "";
            if (!isInferAvailable || match.icon) {
                html += '<span class="main' + trim + '"><u>' + _self.prefix + "</u>" + match.name.substring(_self.prefix.length) + '</span>';
            }
            else if (hasIcons) {
                html += '<span class="main' + trim + '"><span class="deferred">' + match.name + '</span></span>';
            }
            else {
                html += '<span class="main' + trim + '"><span class="deferred"><u>' + _self.prefix + "</u>" + match.name.substring(_self.prefix.length) + '</span></span>';
            }
            
            if (match.meta)
                html += '<span class="meta">' + match.meta + '</span>';
            
            if (match.doc)
                match.doc = '<p>' + match.doc + '</p>';
                
            if (match.icon || match.type)
                match.doc = '<div class="code_complete_doc_head">' + (docHead || match.name) + '</div>' + (match.doc || "")
                
            matchEl.innerHTML = html;
            matchEl.addEventListener("mouseover", function() {
                if (ignoreMouseOnce) {
                    ignoreMouseOnce = false;
                    return;
                }
                _self.matchEls[_self.selectedIdx].className = CLASS_UNSELECTED;
                _self.selectedIdx = idx;
                _self.matchEls[_self.selectedIdx].className = CLASS_SELECTED;
                _self.updateDoc();
                if (!isDrawDocInvokeScheduled)
                    drawDocInvoke.schedule(SHOW_DOC_DELAY_MOUSE_OVER);
            });
            matchEl.addEventListener("click", function() {
                var amlEditor = editors.currentEditor.amlEditor;
                replaceText(amlEditor.$editor, _self.prefix, match);
                amlEditor.focus();
            });
            matchEl.style.height = cursorConfig.lineHeight + EXTRA_LINE_HEIGHT + "px";
            matchEl.style.width = (MENU_WIDTH - 10) + "px";
            _self.completionElement.appendChild(matchEl);
            _self.matchEls.push(matchEl);
        });
        _self.updateDoc(true);
    },

    $guidToShortString : function(guid) {
        var result = guid && guid.replace(/^[^:]+:(([^\/]+)\/)*?([^\/]*?)(\[\d+[^\]]*\])?(\/prototype)?$|.*/, "$3");
        return result && result !== "Object" ? result : "";
    },

    $guidToLongString : function(guid, name) {
        if (guid.substr(0, 6) === "local:")
            return this.$guidToShortString(guid);
        var result = guid && guid.replace(/^[^:]+:(([^\/]+\/)*)*?([^\/]*?)$|.*/, "$1$3");
        if (!result || result === "Object")
            return "";
        result = result.replace(/\//g, ".").replace(/\[\d+[^\]]*\]/g, "");
        if (name !== "prototype")
            result = result.replace(/\.prototype$/, "");
        return result;
    },
    
    updateDoc : function(delayPopup) {
        this.docElement.innerHTML = '<span class="code_complete_doc_body">';
        var selected = this.matches[this.selectedIdx];

        if (selected && selected.doc) {
            if (isDocShown) {
                txtCompleterDoc.parentNode.show();
            }
            else {
                txtCompleterDoc.parentNode.hide();
                if (!isDrawDocInvokeScheduled || delayPopup)
                    drawDocInvoke.schedule(SHOW_DOC_DELAY);
            }
            this.docElement.innerHTML += selected.doc + '</span>';
        }
        else {
            txtCompleterDoc.parentNode.hide();   
        }
        if (selected && selected.docUrl)
            this.docElement.innerHTML += '<p><a href="' + selected.docUrl + '" target="c9doc">(more)</a></p>';
        this.docElement.innerHTML += '</span>';
    },

    onTextInput : function(text, pasted) {
        var keyBinding = editors.currentEditor.ceEditor.$editor.keyBinding;
        oldOnTextInput.apply(keyBinding, arguments);
        if (!pasted) {
            if (!text.match(ID_REGEX))
                this.closeCompletionBox();
            else
                this.deferredInvoke();
        }
    },

    onKeyPress : function(e, hashKey, keyCode) {
        var _self = this;
        
        if(e.metaKey || e.ctrlKey || e.altKey) {
            this.closeCompletionBox();
            return;
        }
        
        var keyBinding = editors.currentEditor.amlEditor.$editor.keyBinding;

        switch(keyCode) {
            case 0: break;
            case 32: // Space
                this.closeCompletionBox();
                break;
            case 27: // Esc
                this.closeCompletionBox();
                e.preventDefault();
                break;
            case 8: // Backspace
                oldCommandKey.apply(keyBinding, arguments);
                deferredInvoke();
                e.preventDefault();
                break;
            case 37:
            case 39:
                oldCommandKey.apply(keyBinding, arguments);
                this.closeCompletionBox();
                e.preventDefault();
                break;
            case 13: // Enter
            case 9: // Tab
                var editor = editors.currentEditor.amlEditor.$editor;
                replaceText(editor, this.prefix, this.matches[this.selectedIdx]);
                this.closeCompletionBox();
                e.preventDefault();
                break;
            case 40: // Down
                if (this.matchEls.length === 1) {
                    this.closeCompletionBox();
                    break;
                }
                e.stopPropagation();
                e.preventDefault();
                this.matchEls[this.selectedIdx].className = CLASS_UNSELECTED;
                if(this.selectedIdx < this.matches.length-1)
                    this.selectedIdx++;
                this.matchEls[this.selectedIdx].className = CLASS_SELECTED;
                if(this.selectedIdx - this.scrollIdx > MENU_SHOWN_ITEMS) {
                    this.scrollIdx++;
                    this.matchEls[this.scrollIdx].scrollIntoView(true);
                }
                this.updateDoc();
                break;
            case 38: // Up
                if (this.matchEls.length === 1) {
                    this.closeCompletionBox();
                    break;
                }
                e.stopPropagation();
                e.preventDefault();
                if (this.selectedIdx <= 0)
                    return; 
                this.matchEls[this.selectedIdx].className = CLASS_UNSELECTED;
                this.selectedIdx--;
                this.matchEls[this.selectedIdx].className = CLASS_SELECTED;
                if(this.selectedIdx < this.scrollIdx) {
                    this.scrollIdx--;
                    this.matchEls[this.scrollIdx].scrollIntoView(true);
                }
                this.updateDoc();
                break;
        }
    },
    
    setWorker: function(worker) {
        this.worker = worker;
    },

    deferredInvoke: function() {
        if (isInvokeScheduled)
            return;
        isInvokeScheduled = true;
        deferredInvoke.schedule(isPopupVisible() ? AUTO_UPDATE_DELAY : AUTO_OPEN_DELAY);
    },
    
    onChange: function() {
        this.deferredInvoke();
    },

    invoke: function(forceBox) {
        var editor = editors.currentEditor.amlEditor.$editor;
        if (editor.inMultiSelectMode) {
            _self.closeCompletionBox();
            return;
        }
        this.forceBox = forceBox;
        editor.addEventListener("change", this.$onChange);
        // This is required to ensure the updated document text has been sent to the worker before the 'complete' message
        var worker = this.worker;
        setTimeout(function() {
            worker.emit("complete", {data: { pos: editor.getCursorPosition(), staticPrefix: ide.staticPrefix}});
        });
        var _self = this;
        if(forceBox)
            killCrashedCompletionInvoke(CRASHED_COMPLETION_TIMEOUT);
    },
    
    onComplete: function(event) {
        var editor = editors.currentEditor.amlEditor.$editor;
        var pos = editor.getCursorPosition();
        var eventPos = event.data.pos;
        var line = editor.getSession().getLine(pos.row);
        var identifier = retrievePreceedingIdentifier(line, pos.column);
    
        editor.removeEventListener("change", this.$onChange);
        killCrashedCompletionInvoke.cancel();

        if (pos.column !== eventPos.column || pos.row !== eventPos.row)
            return;
    
        var matches = event.data.matches;
        
        // Remove out-of-date matches
        for (var i = 0; i < matches.length; i++) {
            if(matches[i].name.indexOf(identifier) !== 0) {
                matches.splice(i, 1);
                i--;
            }
        }        
        
        if (matches.length === 1 && !this.forceBox) {
            replaceText(editor, identifier, matches[0]);
        }
        else if (matches.length > 0) {
            this.showCompletionBox(matches, identifier);
        }
        else {
            if(typeof barCompleterCont !== 'undefined')
               this.closeCompletionBox();
        }
    },
    
    destroy : function(){
        commands.removeCommandByName("complete");
    }
};

});
