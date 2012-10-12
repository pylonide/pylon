/**
 * jumptodef Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*global tabEditors */
define(function(require, exports, module) {

var ext = require("core/ext");
var editors = require("ext/editors/editors");
var commands = require("ext/commands/commands");
var ide = require("core/ide");

module.exports = ext.register("ext/language/jumptodef", {
    name    : "jumptodef",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    nodes   : [],

    hook : function(language, worker){
        var _self = this;
        _self.worker = worker;
        
        commands.addCommand({
            name : "jumptodef",
            bindKey: {mac: "F12", win: "F12"},
            hint: "jump to the definition of the variable or function that is under the cursor",
            isAvailable : function(editor){
                return editor && editor.ceEditor;
            },
            exec: function(){
                _self.jumptodef();
            }
        });
        
        // listen to the worker's response
        worker.on("definition", function(ev) {
            editors.jump({
                column: ev.data.column,
                row: ev.data.row + 1,
                node: tabEditors.getPage().xmlRoot,
                animate: false
            });
        });
    },

    jumptodef: function() {
        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        var sel = editor.getSelection();
        var pos = sel.getCursor();
        
        this.worker.jumpToDefinition({
            data: pos
        });
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