/**
 * jumptodef Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*global tabEditors mnuCtxEditor mnuCtxEditorJumpToDef */
define(function(require, exports, module) {

var ide = require("core/ide");
var editors = require("ext/editors/editors");
var commands = require("ext/commands/commands");

module.exports = {
    nodes : [],
    
    hook : function(language, worker){
        var _self = this;
        _self.worker = worker;
        
        commands.addCommand({
            name : "jumptodef",
            bindKey: {mac: "F3", win: "F3"},
            hint: "jump to the definition of the variable or function that is under the cursor",
            isAvailable : function(editor){
                return editor && editor.ceEditor;
            },
            exec: function(){
                _self.jumptodef();
            }
        });
        
        // right click context item in ace
        ide.addEventListener("init.ext/code/code", function() {
            _self.nodes.push(
                mnuCtxEditor.insertBefore(new apf.divider({
                    visible : "{mnuCtxEditorJumpToDef.visible}"
                }), mnuCtxEditor.firstChild),
                mnuCtxEditor.insertBefore(new apf.item({
                    id : "mnuCtxEditorJumpToDef",
                    caption : "Jump to Definition",
                    command: "jumptodef"
                }), mnuCtxEditor.firstChild)
            );
            
            // when the context menu pops up we'll ask the worker whether we've 
            // jumptodef available here
            apf.addListener(mnuCtxEditor, "prop.visible", function (ev) {
                // only fire when visibility is set to true        
                if (ev.value) {
                    // because of delays we'll enable by default
                    mnuCtxEditorJumpToDef.enable();
                    _self.checkIsJumpToDefAvailable();
                }
            });
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
        
        // when the analyzer tells us if the jumptodef result is available
        // we'll disable/enable the jump to definition item in the ctx menu
        worker.on("isJumpToDefinitionAvailableResult", function (ev) {
            if (ev.data.value) {
                mnuCtxEditorJumpToDef.enable();
            }
            else {
                mnuCtxEditorJumpToDef.disable();
            }
        });
    },
    
    /**
     * Fire an event to the worker that asks whether the jumptodef is available for the
     * current position.
     * Fires an 'isJumpToDefinitionAvailableResult' event on the same channel when ready
     */
    checkIsJumpToDefAvailable: function () {
        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        this.worker.emit("isJumpToDefinitionAvailable", { data: editor.getSelection().getCursor() });
    },

    jumptodef: function() {
        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        var sel = editor.getSelection();
        var pos = sel.getCursor();
        
        this.worker.emit("jumpToDefinition", {
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
};
});