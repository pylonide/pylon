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
    editor : null,
    
    init : function(amlNode){
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Cut",
                onclick : this.cut
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Copy",
                onclick : this.copy
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Paste",
                onclick : this.paste
            }))
        );
        
        /*this.hotitems = {
            "cut" : [this.nodes[1]],
            "copy" : [this.nodes[2]],
            "paste" : [this.nodes[3]]
        };*/
    },

    cut: function() {
        if (apf.document.activeElement == trFiles) {
            apf.clipboard.cutSelection(trFiles);
        }
        else {
            if (this.editor == null) {
                this.editor = editors.currentEditor.ceEditor.$editor;
            }
            this.text = this.editor.getCopyText();
        }
    },

    copy: function() {
        if (apf.document.activeElement == trFiles) {
            apf.clipboard.copySelection(trFiles);
        }
        else {
            if (this.editor == null) {
                this.editor = editors.currentEditor.ceEditor.$editor;
            }
            this.text = this.editor.getCopyText();
        }
    },

    paste: function() {
        if (apf.document.activeElement == trFiles) {
            apf.clipboard.pasteSelection(trFiles);
        }
        else {
            if (this.editor == null) {
                this.editor = editors.currentEditor.ceEditor.$editor;
            }
            if (this.text !== "") {
                this.editor.insert(this.text);
            }
        }
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