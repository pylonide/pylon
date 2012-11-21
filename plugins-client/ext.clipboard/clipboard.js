/**
 * Clipboard Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

"use strict";

var ide = require("core/ide");
var ext = require("core/ext");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var editors = require("ext/editors/editors");

var aceClipboardText = "";

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
        
        var isAvailable = function(editor, event){
            if (apf.activeElement && apf.activeElement.localName == "codeeditor")
                return !(event instanceof KeyboardEvent) && !ide.readonly;
            
            return self.trFiles && apf.activeElement == trFiles && !trFiles.renaming && !ide.readonly;
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
        
        commands.addCommand({
            name: "clearcut",
            bindKey: {mac: "ESC", win: "ESC"},
            isAvailable : function(){
                return self.trFiles && apf.activeElement == trFiles
                  && apf.clipboard.store && !apf.clipboard.copied;
            },
            exec: function(){ 
                var nodes = apf.clipboard.store;
                if (!nodes) return false;
                
                apf.clipboard.$highlightSelection(trFiles, nodes, true);
                apf.clipboard.clear();
                
                return false;
            }
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

    cut: function() {
        if (self.trFiles && apf.document.activeElement == trFiles) {
            apf.clipboard.cutSelection(trFiles);
        }
        else {
            var ace = this.$getAce();
            ace.focus();
            // try-catch is needed because firefox throws error instead of returning false
            try {
                // due to some bug in chrome "cut" is very slow
                document.execCommand("copy");
            } catch(e) {}
            aceClipboardText = ace.getCopyText() || aceClipboardText;

            var cutCommand = ace.$nativeCommands.commands.cut;
            ace.commands.exec(cutCommand, ace);
        }
    },

    copy: function() {
        if (self.trFiles && apf.document.activeElement == trFiles) {
            apf.clipboard.put(trFiles.getSelection().map(function (node) {
                return apf.xmldb.cleanNode(node.cloneNode(false))
            }));
            apf.clipboard.copied = true;
        }
        else {
            var ace = this.$getAce();
            ace.focus();
            try {
                if (document.execCommand("copy")) return;
            } catch(e) {}

            aceClipboardText = ace.getCopyText() || aceClipboardText;
        }
    },

    paste: function() {
       if (self.trFiles && apf.document.activeElement == trFiles) {
            apf.clipboard.pasteSelection(trFiles);
        }
        else {
            var ace = this.$getAce();
            ace.focus();
            try {
                if (document.execCommand("paste")) return;
            } catch(e) {}

            ace.onPaste(aceClipboardText);
        }
    },

    $getAce : function() {
        var editor = editors.currentEditor;
        if (!editor || !editor.amlEditor)
            return;

        var amlEditor = editor.amlEditor;
        return amlEditor.$editor;
    },

    destroy : function(){
        menus.remove("Edit/~", 300);
        menus.remove("Edit/Cut");
        menus.remove("Edit/Copy");
        menus.remove("Edit/Paste");
        
        this.$destroy();
    }
});

});
