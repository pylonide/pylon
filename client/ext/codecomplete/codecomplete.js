/**
 * Code completion for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var code = require("ext/code/code");
var dom = require("ace/lib/dom");

var completeUtil = require("ext/codecomplete/complete_util");
var localCompleter = require("ext/codecomplete/local_completer");
var openFilesLocalCompleter = require("ext/codecomplete/open_files_local_completer");
var snippetCompleter = require("ext/codecomplete/snippet_completer");

var markup = require("text!ext/codecomplete/codecomplete.xml");
var skin = require("text!ext/codecomplete/skin.xml");

/**
 * Asynchrounously performs `fn` on every element of `array` in parallel, then
 * calls callback
 */
function asyncParForEach(array, fn, callback) {
    var completed = 0;
    var arLength = array.length;
    if (arLength === 0) {
        callback();
    }
    for (var i = 0; i < arLength; i++) {
        fn(array[i], function(result, err) {
            completed++;
            if (completed === arLength) {
                callback(result, err);
            }
        });
    }
}


var oldCommandKey;

module.exports = ext.register("ext/codecomplete/codecomplete", {
    name    : "Code Complete",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors],
    nodes   : [],
    alone   : true,
    markup  : markup,
    skin    : skin,
    completers : [],

    hook : function() {
        var _self = this;
        code.commandManager.addCommand({
            name: "codecomplete",
            bindKey: {
                win: "Ctrl-Space|Alt-Space",
                mac: "Ctrl-Space|Alt-Space",
                sender: "editor"
            },
            exec: function(env) {
                _self.invoke();
            }
        });
        
        var completers = [localCompleter, snippetCompleter , openFilesLocalCompleter];
        for(var i = 0; i < completers.length; i++) {
            completers[i].hook();
            this.completers.push(completers[i]);
        }
    },
        
    removeDuplicateMatches: function(matches) {
        // First sort
        matches.sort(function(a, b) {
            if (a.name < b.name)
                return 1;
            else if (a.name > b.name)
                return -1;
            else
                return 0;
        });
        for (var i = 0; i < matches.length - 1; i++) {
            var a = matches[i];
            var b = matches[i + 1];
            if (a.name === b.name) {
                // Duplicate!
                if (a.priority < b.priority)
                    matches.splice(i, 1);
                else if (a.priority > b.priority)
                    matches.splice(i+1, 1);
                else if (a.score < b.score)
                    matches.splice(i, 1);
                else if (a.score > b.score)
                    matches.splice(i+1, 1);
                else
                    matches.splice(i, 1);
                i--;
            }
        }
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
        if(distanceFromBottom < completionBoxHeight) {
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
        if(!doNotHide)
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
                completeUtil.replaceText(editor, _self.prefix, match.replaceText);
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
        var style = dom.computedStyle(this.matchEls[this.selectedIdx]);

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
                completeUtil.replaceText(editor, this.prefix, this.matches[this.selectedIdx].replaceText);
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

    invoke: function invoke(forceBox) {
        var _self = this;
        var editor = editors.currentEditor.ceEditor.$editor;
        var pos = editor.getCursorPosition();
        var line = editor.getSession().getLine(pos.row);
        var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    
        var matches = [];
        asyncParForEach(_self.completers, function(completer, callback) {
            completer.analyze(editor, callback);
        }, function() {
            asyncParForEach(_self.completers, function(completer, callback) {
                completer.complete(editor, function(ms) {
                    matches = matches.concat(ms);
                    callback();
                });
            }, function() {
                _self.removeDuplicateMatches(matches);
                // Sort by priority, score
                matches.sort(function(a, b) {
                    if (a.priority < b.priority)
                        return 1;
                    else if (a.priority > b.priority)
                        return -1;
                    else if (a.score < b.score)
                        return 1;
                    else if (a.score > b.score)
                        return -1;
                    else
                        return 0;
                });
                
                matches = matches.slice(0, 50); // 50 ought to be enough for everybody
                if(matches.length === 1 && !forceBox) {
                    completeUtil.replaceText(editor, identifier, matches[0].replaceText);
                } else if(matches.length > 0) {
                    ext.initExtension(_self);
                    _self.showCompletionBox(matches, identifier);
                } else {
                    if(typeof barCompleterCont !== 'undefined')
                        barCompleterCont.$ext.style.display = "none";
                }
            });
        });
    },
    
    init : function() {
    },
    
    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});
