/**
 * Clipboard Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

"use strict";

var ext = require("core/ext");
var menus = require("ext/menus/menus");
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
            menus.addItemByPath("Edit/~", new apf.divider(), 300),
            menus.addItemByPath("Edit/Cut", new apf.item({
                hotkey : apf.isMac ? "Command-X" : "Ctrl-X", // TODO: Don't hardcode this
                onclick : function() {
                    _self.cut();
                }
            }), 400),
            menus.addItemByPath("Edit/Copy", new apf.item({
                hotkey : apf.isMac ? "Command-C" : "Ctrl-C", // TODO: Don't hardcode this
                onclick : function() { 
                    _self.copy();
                }
            }), 500),
            menus.addItemByPath("Edit/Paste", new apf.item({
                hotkey : apf.isMac ? "Command-V" : "Ctrl-V", // TODO: Don't hardcode this
                caption : "Paste",
                onclick : function() { 
                    _self.paste();
                }
            }), 600)
        );
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
        menus.remove("Edit/~", 300);
        menus.remove("Edit/Cut");
        menus.remove("Edit/Copy");
        menus.remove("Edit/Paste");
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});