16/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var editors = require("ext/editors/editors");
var dom = require("ace/lib/dom");
var keyhandler = require("ext/language/keyhandler");
var completionUtil = require("ext/codecomplete/complete_util");

var lang = require("ace/lib/lang");
var ID_REGEX = /[a-zA-Z_0-9\$\_]/;

var oldCommandKey, oldOnTextInput;
var isDocShown;

var CLASS_SELECTED = "cc_complete_option selected";
var CLASS_UNSELECTED = "cc_complete_option";
var SHOW_DOC_DELAY = 2000;
var HIDE_DOC_DELAY = 1000;
var AUTO_OPEN_DELAY = 200;
var AUTO_UPDATE_DELAY = 200;
var CRASHED_COMPLETION_TIMEOUT = 6000;
var MENU_WIDTH = 300;
var MENU_SHOWN_ITEMS = 8;
var EXTRA_LINE_HEIGHT = 3;
var deferredInvoke = lang.deferredCall(function() {
    var editor = editors.currentEditor.ceEditor.$editor;
    var pos = editor.getCursorPosition();
    var line = editor.getSession().getDocument().getLine(pos.row);
    if(keyhandler.preceededByIdentifier(line, pos.column) ||
       line[pos.column - 1] === '.' ||
       keyhandler.isRequireJSCall(line, pos.column)) {
        module.exports.invoke(true);
    }
    else {
        module.exports.closeCompletionBox();
    }
    isInvokeScheduled = false;
});
var isInvokeScheduled = false;

var drawDocInvoke = lang.deferredCall(function() {
    if (isPopupVisible()) {
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
    _self.closeCompletionBox();
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
    
    if (match.replaceText === "require(^^)") {
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
    editor.moveCursorTo(pos.row + rowOffset, pos.column + colOffset - prefix.length);
}

var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");

module.exports = {
    hook: function(ext, worker) {
        var _self = this;
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
                _self.completionElement.scrollTop = 0;
            }
        });
    },

    closeCompletionBox : function(event) {
        barCompleterCont.$ext.style.display = "none";
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
        var isInferAvailable = completionUtil.isInferAvailable();
        matches.forEach(function(match, idx) {
            var matchEl = dom.createElement("div");
            matchEl.className = idx === _self.selectedIdx ? CLASS_SELECTED : CLASS_UNSELECTED;
            var html = "";
            
            if (match.icon)
                html = "<img src='/static/ext/language/img/" + match.icon + ".png'/>";
                
            if (!isInferAvailable || match.icon) {
                html += "<span class='main'><u>" + _self.prefix + "</u>" + match.name.substring(_self.prefix.length);
            }
            else if (hasIcons) {
                html += '<span class="main"><span class="deferred">' + _self.name + match.name.substring(_self.prefix.length) + '</span>';
            }
            else {
                html += '<span class="main"><span class="deferred"><u>' + _self.prefix + "</u>" + match.name.substring(_self.prefix.length) + '</span>';
            }
            
            if (match.meta) {
                html += '<span class="meta">' + match.meta + '</span>';
            }
            html += '</span>';
            matchEl.innerHTML = html;
            matchEl.addEventListener("mouseover", function() {
                _self.matchEls[_self.selectedIdx].className = CLASS_UNSELECTED;
                _self.selectedIdx = idx;
                _self.matchEls[_self.selectedIdx].className = CLASS_SELECTED;
                _self.updateDoc();                
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
        _self.updateDoc();
    },
    
    updateDoc : function(delayPopup) {
        this.docElement.innerHTML = '<span class="codecompletedoc_body">';
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
            this.docElement.innerHTML += '<div><a href="' + selected.docUrl + '" target="c9doc">(more)</a></div>';
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
        
        if(keyCode === 9 && !e.shiftKey) // Tab
            keyCode = 40; // Up
        else if(keyCode === 9 && e.shiftKey) // Shift-Tab
            keyCode = 38; // Down
        
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
                var editor = editors.currentEditor.amlEditor.$editor;
                replaceText(editor, this.prefix, this.matches[this.selectedIdx]);
                this.closeCompletionBox();
                e.preventDefault();
                break;
            case 40: // Down
                this.matchEls[this.selectedIdx].className = CLASS_UNSELECTED;
                if(this.selectedIdx < this.matches.length-1)
                    this.selectedIdx++;
                this.matchEls[this.selectedIdx].className = CLASS_SELECTED;
                if(this.selectedIdx - this.scrollIdx > MENU_SHOWN_ITEMS) {
                    this.scrollIdx++;
                    this.matchEls[this.scrollIdx].scrollIntoView(true);
                }
                e.stopPropagation();
                e.preventDefault();
                this.updateDoc();
                break;
            case 38: // Up
                this.matchEls[this.selectedIdx].className = CLASS_UNSELECTED;
                if(this.selectedIdx > 0) 
                    this.selectedIdx--;
                else {
                    this.closeCompletionBox();
                    return;
                }
                this.matchEls[this.selectedIdx].className = CLASS_SELECTED;
                if(this.selectedIdx < this.scrollIdx) {
                    this.scrollIdx--;
                    this.matchEls[this.scrollIdx].scrollIntoView(true);
                }
                e.stopPropagation();
                e.preventDefault();
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
            worker.emit("complete", {data: editor.getCursorPosition()});
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
