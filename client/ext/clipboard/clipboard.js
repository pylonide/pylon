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
var commands = require("ext/commands/commands");
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
        
        var isAvailable = function(){
            if (apf.activeElement.localName == "codeeditor")
                return !(window.event instanceof KeyboardEvent);
            
            return apf.activeElement == trFiles;
        };
        
        commands.addCommand({
            name: "cut",
            bindKey: {mac: "Command-X", win: "Ctrl-X"},
            isAvailable : isAvailable,
            exec: function(){ _self.cut(); }
        });
        
        commands.addCommand({
            name: "copy",
            bindKey: {mac: "Command-C", win: "Ctrl-C"},
            isAvailable : isAvailable,
            exec: function(){ _self.copy(); }
        });
        
        commands.addCommand({
            name: "paste",
            bindKey: {mac: "Command-V", win: "Ctrl-V"},
            isAvailable : isAvailable,
            exec: function(){ _self.paste(); }
        });
        
        this.nodes.push(
            menus.addItemByPath("Edit/~", new apf.divider(), 300),
            menus.addItemByPath("Edit/Cut", new apf.item({
                command : "cut"
            }), 400),
            menus.addItemByPath("Edit/Copy", new apf.item({
                command : "copy"
            }), 500),
            menus.addItemByPath("Edit/Paste", new apf.item({
                command : "paste"
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
            var ace = this.$getAce();
            ace.$nativeCommands.exec("cut", ace);
        }
    },

    copy: function() {
        if (apf.document.activeElement == trFiles) {
            apf.clipboard.put(trFiles.getSelection().map(function (node) {
                return apf.xmldb.cleanNode(node.cloneNode(false))
            }));
            apf.clipboard.copied = true;
        }
        else {
            var ace = this.$getAce();
            ace.textInput.emitCopy();
        }
    },

    paste: function() {
       if (apf.document.activeElement == trFiles) {
            apf.clipboard.pasteSelection(trFiles);
        }
        else {
            var ace = this.$getAce();
            ace.textInput.emitPaste();
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
