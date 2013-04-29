/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {
    
/*global barQuickfixCont sbQuickfix txtQuickfixHolder txtQuickfix txtQuickfixDoc */

var ide = require("core/ide");
var dom = require("ace/lib/dom");
var code = require("ext/code/code");
var editors = require("ext/editors/editors");
var lang = require("ace/lib/lang");

var quickfix;

var oldCommandKey, oldOnTextInput;

var CLASS_SELECTED = "cc_complete_option selected";
var CLASS_UNSELECTED = "cc_complete_option";
var SHOW_DOC_DELAY = 1500;
var SHOW_DOC_DELAY_MOUSE_OVER = 100;
var HIDE_DOC_DELAY = 1000;
var MENU_WIDTH = 400;
var MENU_SHOWN_ITEMS = 9;
var EXTRA_LINE_HEIGHT = 3;
var QFBOX_MINTIME = 500;


var ignoreMouseOnce = false;
var isDocShown;
var isDrawDocInvokeScheduled = false;

var drawDocInvoke = lang.deferredCall(function() {
    if (isPopupVisible() && quickfix.quickFixes[quickfix.selectedIdx].preview) {
        isDocShown = true;
        txtQuickfixDoc.parentNode.show();
    }
    isDrawDocInvokeScheduled = false;
});

var undrawDocInvoke = lang.deferredCall(function() {
    if (!isPopupVisible()) {
        isDocShown = false;
        txtQuickfixDoc.parentNode.hide();
    }
});

function isPopupVisible() {
    return barQuickfixCont.$ext.style.display !== "none";
}

var commands = require("ext/commands/commands");

module.exports = {
 
    hook: function(ext) {
        var _self = this;
        quickfix = this;
                  
        ide.addEventListener("tab.afterswitch", function(e) {
            var page = e.nextPage;
            if (!page || !page.$editor || page.$editor.path != "ext/code/code")
                return;
            var ace = page.$editor.amlEditor.$editor;
            
            if (!ace.$markerListener)
                _self.initEditor(ace);           
        });
        
        
        commands.addCommand({
            name: "quickfix",
            hint: "quickfix",
            bindKey: {mac: "Ctrl-Shift-Q|Ctrl-Alt-Q", win: "Ctrl-Shift-Q|Ctrl-Alt-Q"},
            isAvailable : function(editor){
                return apf.activeElement.localName == "codeeditor";
            },
            exec: function(editor) {
                _self.invoke();
            }
        });
          
           
    },
    
    init: function(amlNode) {
    },
    
    initEditor : function(editor){
        var _self = this;
               
        editor.on("guttermousedown", editor.$markerListener = function(e) {
             _self.editor = editor;
            if (e.getButton()) // !editor.isFocused()
                return;
            var gutterRegion = editor.renderer.$gutterLayer.getRegion(e);
            if (gutterRegion != "markers")
                return;
            
            var row = e.getDocumentPosition().row;
            _self.showQuickfixBox(row, 0);
            
        });
    },
        
    getAnnos: function(row){
        var editor = editors.currentEditor.amlEditor.$editor;
        var res = [];
        
        editor.getSession().languageAnnos.forEach(function(anno, idx){
            if (anno.row == row){
                res.push(anno);
                
                /* Select the annotation in the editor */
                anno.select = function(){
                    if (!(anno.pos.sl && anno.pos.sc && anno.pos.el && anno.pos.ec)){
                        return;
                    }
                    var startPos = { row: anno.pos.sl, column: anno.pos.sc };
                    var endPos = { row: anno.pos.el, column: anno.pos.ec };
                    if (startPos.row < endPos.row || startPos.column < endPos.column){
                        editor.getSelection().setSelectionRange(
                            {start: startPos, end: endPos});
                    }
                };
                
                /*
                 * Returns the screen coordinates of the start of the annotation
                 */
                anno.getScreenCoordinates = function(){
                    return editor.renderer.textToScreenCoordinates(anno.pos.sl,
                                                                   anno.pos.sc);  
                };
            }
        });
        
        res.sort(function(a,b){ return a.pos.sc - b.pos.sc; });
        
        return res;
    },
    
    
    
  showQuickfixBox: function(row, column) {
        var _self = this;

        // Get the annotation on this line that is containing or left of the 
        // position (row,column)
        var annos = _self.getAnnos(row);
        if (!annos.length){
            return;
        }
        for (var i = 0; i < annos.length - 1; i++){
            if (annos[i+1].pos.sc > column){ break; }
        }
        var anno = annos[i];
        if (!anno.resolutions.length){
            // TODO If some other annotation on this line has resolutions, 
            // quickfix that one instead
            return;
        }

        this.editor = editors.currentEditor;
        var ace = this.editor.amlEditor.$editor;
        this.selectedIdx = 0;
        this.scrollIdx = 0;
        this.quickfixEls = [];
        //this.annos = annos;
        this.quickFixes = [];
        this.quickfixElement = txtQuickfix.$ext;
        this.docElement = txtQuickfixDoc.$ext;
        this.cursorConfig = ace.renderer.$cursorLayer.config;
        this.lineHeight = this.cursorConfig.lineHeight + EXTRA_LINE_HEIGHT;
        var style = dom.computedStyle(this.editor.amlEditor.$ext);
        this.quickfixElement.style.fontSize = style.fontSize;
        
        barQuickfixCont.setAttribute('visible', true);


        // Monkey patch
        if(!oldCommandKey) {
            oldCommandKey = ace.keyBinding.onCommandKey;
            ace.keyBinding.onCommandKey = this.onKeyPress.bind(this);
            oldOnTextInput = ace.keyBinding.onTextInput;
            ace.keyBinding.onTextInput = this.onTextInput.bind(this);
        }
        
        // Collect all quickfixes for the given annotation
        _self.quickFixes = anno.resolutions;
        
        // Select it in the editor
        anno.select();
        
        this.populateQuickfixBox(this.quickFixes);

        apf.popup.setContent("quickfixBox", barQuickfixCont.$ext);
        var boxLength = this.quickFixes.length || 1;
        var quickfixBoxHeight = 11 + Math.min(10 * this.lineHeight, boxLength * (this.lineHeight));
        
        var innerBoxLength = this.quickFixes.length || 1;
        var innerQuickfixBoxHeight = Math.min(10 * this.lineHeight, innerBoxLength * (this.lineHeight));
        txtQuickfixHolder.$ext.style.height = innerQuickfixBoxHeight + "px";
        
        ignoreMouseOnce = !isPopupVisible();
        
        var pos = anno.getScreenCoordinates();
        apf.popup.show("quickfixBox", {
            x        : pos.pageX, 
            y        : pos.pageY + _self.cursorConfig.lineHeight, 
            height   : quickfixBoxHeight,
            width    : MENU_WIDTH,
            animate  : false,
            callback : function() {
                barQuickfixCont.setHeight(quickfixBoxHeight);
                barQuickfixCont.$ext.style.height = quickfixBoxHeight + "px";
                sbQuickfix.$resize();
                // HACK: Need to set with non-falsy value first
                _self.quickfixElement.scrollTop = 1;
                _self.quickfixElement.scrollTop = 0;
            }
        });
        
        this.popupTime = new Date().getTime();
        document.addEventListener("click", quickfix.closeQuickfixBox, false);
        ace.container.addEventListener("DOMMouseScroll", quickfix.closeQuickfixBox, false);
        ace.container.addEventListener("mousewheel", quickfix.closeQuickfixBox, false);
    },

    closeQuickfixBox : function(event) {
        var qfBoxTime = new Date().getTime() - quickfix.popupTime;
        if (!quickfix.forceClose && qfBoxTime < QFBOX_MINTIME){
            return;
        }
        
        quickfix.forceClose = false;
    
        barQuickfixCont.$ext.style.display = "none";
        if (!editors.currentEditor.amlEditor) // no editor, try again later
            return;
        var ace = editors.currentEditor.amlEditor.$editor;
        
        // TODO these calls don't work.
        document.removeEventListener("click", quickfix.closeQuickfixBox, false);
        ace.container.removeEventListener("DOMMouseScroll", quickfix.closeQuickfixBox, false);
        ace.container.removeEventListener("mousewheel", quickfix.closeQuickfixBox, false);
        
        if(oldCommandKey) {
            ace.keyBinding.onCommandKey = oldCommandKey;
            ace.keyBinding.onTextInput = oldOnTextInput;
        }
        oldCommandKey = oldOnTextInput = null;
        undrawDocInvoke.schedule(HIDE_DOC_DELAY);
    },
    
    
    populateQuickfixBox: function(quickFixes) {
        
        var _self = this;
        _self.quickfixElement.innerHTML = "";
        var cursorConfig = code.amlEditor.$editor.renderer.$cursorLayer.config;

        // For each quickfix, create a list entry
        quickFixes.forEach(function(qfix, qfidx){

            var annoEl = dom.createElement("div");
            annoEl.className = qfidx === _self.selectedIdx ? CLASS_SELECTED : CLASS_UNSELECTED;
            var html = "";

            if (qfix.image)
                html = "<img src='" + ide.staticPrefix + qfix.image + "'/>";

            html += '<span class="main">' + qfix.label + '</span>';

            annoEl.innerHTML = html;     
            
            annoEl.addEventListener("mouseover", function() {
                if (ignoreMouseOnce) {
                    ignoreMouseOnce = false;
                    return;
                }
                _self.quickfixEls[_self.selectedIdx].className = CLASS_UNSELECTED;
                _self.selectedIdx = qfidx;
                _self.quickfixEls[_self.selectedIdx].className = CLASS_SELECTED;
                _self.updateDoc();
                if (!isDrawDocInvokeScheduled)
                    drawDocInvoke.schedule(SHOW_DOC_DELAY_MOUSE_OVER);
            });
            
            
            annoEl.addEventListener("click", function() {
                quickfix.forceClose = true;
                _self.applyQuickfix(qfix);
            });
            
            
            annoEl.style.height = cursorConfig.lineHeight + EXTRA_LINE_HEIGHT +  "px";
            annoEl.style.width = (MENU_WIDTH - 10) + "px";
            _self.quickfixElement.appendChild(annoEl);
            _self.quickfixEls.push(annoEl);
        });

        _self.updateDoc(true);
        
    },
    
    updateDoc : function(delayPopup) {
        this.docElement.innerHTML = '<span class="code_complete_doc_body">';
        var selected = this.quickFixes[this.selectedIdx];

        if (selected && selected.preview) {
            if (isDocShown) {
                txtQuickfixDoc.parentNode.show();
            }
            else {
                txtQuickfixDoc.parentNode.hide();
                if (!isDrawDocInvokeScheduled || delayPopup)
                    drawDocInvoke.schedule(SHOW_DOC_DELAY);
            }
            this.docElement.innerHTML += 
                selected.preview.replace(/\n/g, '<br/>') + '</span>';
        }
        else {
            txtQuickfixDoc.parentNode.hide();
        }

        this.docElement.innerHTML += '</span>';
    },

    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    },
    
    applyQuickfix : function(qfix){
        var amlEditor = editors.currentEditor.amlEditor;
        var doc = amlEditor.getSession().getDocument();

        doc.applyDeltas(qfix.deltas);
        amlEditor.focus();
    
        if (qfix.cursorTarget){
            var cursorTarget = qfix.cursorTarget;
            var selection = amlEditor.$editor.getSelection();
            selection.clearSelection();
            selection.moveCursorTo(cursorTarget.line,
            cursorTarget.column, false);
        }
    },
    
    onTextInput : function(text, pasted) {
        this.closeQuickfixBox();
    },

    onKeyPress : function(e, hashKey, keyCode) {
        
        if(e.metaKey || e.ctrlKey || e.altKey) {
            this.closeQuickfixBox();
            return;
        }
        
        var keyBinding = editors.currentEditor.amlEditor.$editor.keyBinding;

        switch(keyCode) {
            case 0: break;
            case 32: // Space
                this.closeQuickfixBox();
                break;
            case 27: // Esc
                this.closeQuickfixBox();
                e.preventDefault();
                break;
            case 8: // Backspace
                this.closeQuickfixBox();
                e.preventDefault();
                break;
            case 37:
            case 39:
                oldCommandKey.apply(keyBinding, arguments);
                this.closeQuickfixBox();
                e.preventDefault();
                break;
            case 13: // Enter
            case 9: // Tab
                this.applyQuickfix(this.quickFixes[this.selectedIdx]);
                quickfix.forceClose = true;
                this.closeQuickfixBox();
                e.stopPropagation();
                e.preventDefault();
                break;
            case 40: // Down
                if (this.quickfixEls.length === 1) {
                    this.closeQuickfixBox();
                    break;
                }
                e.stopPropagation();
                e.preventDefault();
                this.quickfixEls[this.selectedIdx].className = CLASS_UNSELECTED;
                if(this.selectedIdx < this.quickFixes.length-1)
                    this.selectedIdx++;
                this.quickfixEls[this.selectedIdx].className = CLASS_SELECTED;
                if(this.selectedIdx - this.scrollIdx > MENU_SHOWN_ITEMS) {
                    this.scrollIdx++;
                    this.quickfixEls[this.scrollIdx].scrollIntoView(true);
                }
                this.updateDoc();
                break;
            case 38: // Up
                if (this.quickfixEls.length === 1) {
                this.closeQuickfixBox();
                    break;
                }
                e.stopPropagation();
                e.preventDefault();
                if (this.selectedIdx <= 0)
                    return;
                this.quickfixEls[this.selectedIdx].className = CLASS_UNSELECTED;
                this.selectedIdx--;
                this.quickfixEls[this.selectedIdx].className = CLASS_SELECTED;
                if(this.selectedIdx < this.scrollIdx) {
                    this.scrollIdx--;
                    this.quickfixEls[this.scrollIdx].scrollIntoView(true);
                }
                this.updateDoc();
                break;
        }
    },
    
    invoke: function(forceBox) {
        var _self = this;
        var editor = editors.currentEditor.amlEditor.$editor;
        if (editor.inMultiSelectMode) {
            _self.closeQuickfixBox();
            return;
        }
        _self.forceBox = forceBox;
        
        var pos = editor.getCursorPosition();
        
        _self.showQuickfixBox(pos.row, pos.column);
    }
 
};

});
