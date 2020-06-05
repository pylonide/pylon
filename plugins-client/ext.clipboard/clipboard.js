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
            if (ppc.activeElement && ppc.activeElement.localName == "codeeditor") {
                var type = event && event.type;
                return type != "keypress" && type != "keydown" && !ide.readonly;
            }
            
            return self.trFiles && !trFiles.renaming && !ide.readonly;
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
            isAvailable : isAvailable,
            exec: function(editor, args){ _self.paste(editor, args); }
        });
        
        commands.addCommand({
            name: "clearcut",
            bindKey: {mac: "ESC", win: "ESC"},
            isAvailable : function(){
                return self.trFiles && ppc.activeElement == trFiles
                  && ppc.clipboard.store && !ppc.clipboard.copied;
            },
            exec: function(){ 
                var nodes = ppc.clipboard.store;
                if (!nodes) return false;
                
                ppc.clipboard.$highlightSelection(trFiles, nodes, true);
                ppc.clipboard.clear();
                
                return false;
            }
        });
        
        this.nodes.push(
            menus.addItemByPath("Edit/~", new ppc.divider(), 300),
            menus.addItemByPath("Edit/Cut", new ppc.item({
                command : "cut"
            }), 400),
            menus.addItemByPath("Edit/Copy", new ppc.item({
                command : "copy"
            }), 500),
            menus.addItemByPath("Edit/Paste", new ppc.item({
                command : "paste"
            }), 600)
        );
    },

    cut: function() {
        if (self.trFiles && ppc.document.activeElement == trFiles) {
            ppc.clipboard.cutSelection(trFiles);
        }
        else {
            var ace = this.$getAce();
            ace.focus();
            aceClipboardText = ace.getCopyText() || aceClipboardText;
            ppc.clipboard.put(aceClipboardText);
            var cutCommand = ace.$nativeCommands.commands.cut;
            ace.blur();
            
            // try-catch is needed because firefox throws error instead of returning false
            try {
                // due to some bug in chrome "cut" is very slow
                document.execCommand("copy");
            } catch(e) {}

            ace.commands.exec(cutCommand, ace);
        }
    },

    copy: function() {
        if (self.trFiles && ppc.document.activeElement == trFiles) {
            ppc.clipboard.put(trFiles.getSelection().map(function (node) {
                return ppc.xmldb.cleanNode(node.cloneNode(false))
            }));
            ppc.clipboard.copied = true;
        }
        else {
            var ace = this.$getAce();
            ace.focus();
            aceClipboardText = ace.getCopyText() || aceClipboardText;
            ppc.clipboard.put(aceClipboardText);
            ace.blur();
            try {
                if (document.execCommand("copy")) return;
            } catch(e) {}
        }
    },

    paste: function(editor, args) {
        if (self.trFiles && ppc.document.activeElement == trFiles) {
            ppc.clipboard.pasteSelection(trFiles);
        }
        else {
            var ace = this.$getAce();
            
            if(args.text) {
                // The paste event came in via keyboard shortcut, we have access
                // to the system clipboard content
                ppc.clipboard.put(args.text);
                ace.$handlePaste(args);
            }
            else if(!ppc.clipboard.empty && typeof ppc.clipboard.store === 'string') {
                // The paste event was triggered via menus or cli, we have a string
                // in ppc.clipboard
                ace.$handlePaste(ppc.clipboard.store);
            }
            else {
                // The paste event was triggered via menus or cli, we only have
                // access to the internal clipboard
                ace.$handlePaste(aceClipboardText);
            }
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
