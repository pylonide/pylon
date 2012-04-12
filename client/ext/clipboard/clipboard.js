/**
 * Clipboard Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

"use strict";

var ext = require("core/ext");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/clipboard/clipboard", {
    dev    : "Ajax.org",
    name   : "Clipboard",
    alone  : true,
    type   : ext.GENERAL,
    
    nodes  : [],
    text   : "",
    range  : null,
 
    hook : function(){
        var _self = this;
        
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Cut",
                onclick : function() {
                    _self.cut();
                }
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Copy",
                onclick : function() { 
                    _self.copy();
                }
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Paste",
                onclick : function() { 
                    _self.paste();
                }
        })));
    },

    init : function (amlNode) {
        // do nothing
    },

    cut: function() {
        if (apf.document.activeElement == trFiles) {
            apf.clipboard.cutSelection(trFiles);
        }
        else {
            if (this.editor == null) {
                this.editor = editors.currentEditor.ceEditor.$editor;
            }
            var ace = this.$getAce();
            this.text = ace.getCopyText();
            ace.remove(ace.getSelectionRange());
        }
    },

    copy: function() {
       if (apf.document.activeElement == trFiles) {
            apf.clipboard.copySelection(trFiles);
        }
        else {
            var ace = this.$getAce();
            this.text = ace.getCopyText();
        }
    },

    paste: function() {
       if (apf.document.activeElement == trFiles) {
            apf.clipboard.pasteSelection(trFiles);
        }
        else {
            var ace = this.$getAce();
            ace.getSession().replace(ace.getSelectionRange(), this.text);
        }
    },

    // seems to be some bug--once the context menu pops up, 
    // ace selection disappears.
    keepRange : function() {
        var ace = this.$getAce();
        this.range = ace.getSelectionRange();
    },
    
    showRange : function() {
        var _self = this;
        setInterval(function() {
            if (!mnuCtxEditor.visible) {
                clearInterval(this);
            }
            else {
                var ace = _self.$getAce();
                ace.getSelection().setSelectionRange(_self.range);
            }
        }, 10);
    },
    
    $getAce : function() {
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
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});