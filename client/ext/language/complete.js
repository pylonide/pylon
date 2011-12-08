/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var editors = require("ext/editors/editors");
var dom = require("ace/lib/dom");

var oldCommandKey;
var ID_REGEX = /[a-zA-Z_0-9\$]/;

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

/**
 * Replaces the preceeding identifier (`prefix`) with `newText`, where ^^
 * indicates the cursor position after the replacement
 */
function replaceText(editor, prefix, newText) {
    var pos = editor.getCursorPosition();
    var line = editor.getSession().getLine(pos.row);
    var doc = editor.getSession().getDocument();
    
    if (newText.indexOf("^^") === -1)
        newText += "^^";

    // Find prefix whitespace of current line
    for (var i = 0; i < line.length && (line[i] === ' ' || line[i] === "\t");)
        i++;
    
    var prefixWhitespace = line.substring(0, i);
    
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
    
    doc.removeInLine(pos.row, pos.column - prefix.length, pos.column);
    doc.insert({row: pos.row, column: pos.column - prefix.length}, paddedLines);
    editor.moveCursorTo(pos.row + rowOffset, pos.column + colOffset - prefix.length);
}

module.exports = {
    hook: function(language, worker) {
        var _self = this;
        worker.on("complete", function(event) {
            _self.onComplete(event);
        });
    },
    
    showCompletionBox: function(matches, prefix) {
        var _self = this;
        this.editor = editors.currentEditor;
        var ace = this.editor.ceEditor.$editor;
        this.selectedIdx = 0;
        this.scrollIdx = 0;
        this.matchEls = [];
        this.prefix = prefix;
        this.matches = matches;
        this.completionElement = txtCompleter.$ext;
        this.cursorConfig = ace.renderer.$cursorLayer.config;
        var style = dom.computedStyle(this.editor.ceEditor.$ext);
        this.completionElement.style.fontSize = style.fontSize;
        //this.completionElement.style.maxHeight = 10 * this.cursorConfig.lineHeight;
        
        barCompleterCont.setAttribute('visible', true);

        // Monkey patch
        oldCommandKey = ace.keyBinding.onCommandKey;
        ace.keyBinding.onCommandKey = this.onKeyPress.bind(this);
        
        this.populateCompletionBox(matches);
        document.addEventListener("click", this.closeCompletionBox);
        ace.container.addEventListener("DOMMouseScroll", this.closeCompletionBox);
        ace.container.addEventListener("mousewheel", this.closeCompletionBox);
        
        apf.popup.setContent("completionBox", barCompleterCont.$ext);
        var completionBoxHeight = 5 + Math.min(10 * this.cursorConfig.lineHeight, this.matches.length * (this.cursorConfig.lineHeight+1));
        var cursorLayer = ace.renderer.$cursorLayer;
        var cursorLocation = cursorLayer.getPixelPosition(true);
        var distanceFromBottom = ace.container.offsetHeight - cursorLocation.top;
        if (distanceFromBottom < completionBoxHeight) {
            ace.centerSelection();
        }
        setTimeout(function() {
            apf.popup.show("completionBox", {
                x        : (prefix.length * -_self.cursorConfig.characterWidth) - 11,
                y        : _self.cursorConfig.lineHeight,
                animate  : false,
                ref      : cursorLayer.cursor,
                callback : function() {
                    barCompleterCont.setHeight(completionBoxHeight);
                    sbCompleter.$resize();
                    _self.completionElement.scrollTop = 0;
                }
            });
        }, 0);
    },

    closeCompletionBox : function(event, doNotHide) {
        var ace = editors.currentEditor.ceEditor.$editor;
        if (!doNotHide)
            barCompleterCont.$ext.style.display = "none";
        document.removeEventListener("click", this.closeCompletionBox);
        ace.container.removeEventListener("DOMMouseScroll", this.closeCompletionBox);
        ace.container.removeEventListener("mousewheel", this.closeCompletionBox);
        ace.keyBinding.onCommandKey = oldCommandKey;
    },
        

    populateCompletionBox: function (matches) {
        var _self = this;
        _self.completionElement.innerHTML = "";
        matches.forEach(function(match, idx) {
            var matchEl = dom.createElement("div");
            matchEl.className = idx === _self.selectedIdx ? "cc_complete_option_selected" : "cc_complete_option";
            matchEl.innerHTML = "<u>" + _self.prefix + "</u>" + match.name.substring(_self.prefix.length);
            if(match.meta) {
                matchEl.innerHTML += '<span class="meta">' + match.meta + '</score>';
            }
            matchEl.addEventListener("click", function() {
                var editor = editors.currentEditor.ceEditor.$editor;
                replaceText(editor, _self.prefix, match.replaceText);
                editor.focus();
            });
            _self.completionElement.appendChild(matchEl);
            _self.matchEls.push(matchEl);
        });
    },

    onKeyPress : function(e, hashKey, keyCode) {
        var _self = this;
        
        if(keyCode === 9 && !e.shiftKey) // Tab
            keyCode = 40; // Up
        else if(keyCode === 9 && e.shiftKey) // Shift-Tab
            keyCode = 38; // Down
        
        var keyBinding = editors.currentEditor.ceEditor.$editor.keyBinding;

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
                setTimeout(function() {
                    _self.closeCompletionBox(null, true);
                    _self.invoke(true);
                }, 100);
                e.preventDefault();
                break;
            case 37:
            case 39:
                oldCommandKey.apply(keyBinding, arguments);
                this.closeCompletionBox();
                e.preventDefault();
                break;
            case 13: // Enter
                var editor = editors.currentEditor.ceEditor.$editor;
                replaceText(editor, this.prefix, this.matches[this.selectedIdx].replaceText);
                this.closeCompletionBox();
                e.preventDefault();
                break;
            case 40: // Down
                this.matchEls[this.selectedIdx].className = "cc_complete_option";
                if(this.selectedIdx < this.matches.length-1) {
                    this.selectedIdx++;
                }
                this.matchEls[this.selectedIdx].className = "cc_complete_option_selected";
                if(this.selectedIdx - this.scrollIdx > 4) {
                    this.scrollIdx++;
                    this.matchEls[this.scrollIdx].scrollIntoView(true);
                }
                e.stopPropagation();
                e.preventDefault();
                break;
            case 38: // Up
                this.matchEls[this.selectedIdx].className = "cc_complete_option";
                if(this.selectedIdx > 0) {
                    this.selectedIdx--;
                }
                this.matchEls[this.selectedIdx].className = "cc_complete_option_selected";
                if(this.selectedIdx < this.matches.length - 4 && this.scrollIdx > 0) {
                    this.scrollIdx = this.selectedIdx - 4;
                    this.matchEls[this.scrollIdx].scrollIntoView(true);
                }
                e.stopPropagation();
                e.preventDefault();
                break;
            default:
                setTimeout(function() {
                    _self.closeCompletionBox(null, true);
                    _self.invoke(true);
                });
        }
    },
    
    setWorker: function(worker) {
        this.worker = worker;
    },

    invoke: function(forceBox) {
        var editor = editors.currentEditor.ceEditor.$editor;
        this.forceBox = forceBox;
        // This is required to ensure the updated document text has been sent to the worker before the 'complete' message
        var worker = this.worker;
        setTimeout(function() {
            worker.emit("complete", {data: editor.getCursorPosition()});
        });
    },
    
    onComplete: function(event) {
        var editor = editors.currentEditor.ceEditor.$editor;
        var pos = editor.getCursorPosition();
        var line = editor.getSession().getLine(pos.row);
        var identifier = retrievePreceedingIdentifier(line, pos.column);
    
        var matches = event.data;
        
        if (matches.length === 1 && !this.forceBox) {
            replaceText(editor, identifier, matches[0].replaceText);
        }
        else if (matches.length > 0) {
            this.showCompletionBox(matches, identifier);
        }
        else {
            if(typeof barCompleterCont !== 'undefined')
                barCompleterCont.$ext.style.display = "none";
        }
    }
};

});
