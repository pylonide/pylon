/**
 * Code Tools Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

module.exports = ext.register("ext/codetools/codetools", {
    dev    : "Ajax.org",
    name   : "Code Tools",
    alone  : true,
    type   : ext.GENERAL,

    nodes : [],

    hook : function(amlNode){
        var _self = this;
        
        ide.addEventListener("init.ext/code/code", function(e) {
            _self.attachEditorEvents(ceEditor);
        });
    },
    
    attachEditorEvents: function(amlEditor) {
        var editor = amlEditor.$editor;
        var prevRow;
            
        editor.addEventListener("mousemove", function(e) {
            var pos = e.getDocumentPosition();
            var row = pos.row;
            var doc = editor.session.doc;
            
            if (prevRow === row)
                return;
            prevRow = row;
            
            ide.dispatchEvent("codetools.rowchange", {
                amlEditor: amlEditor,
                editor: editor,
                pos: pos,
                doc: doc
            });
        });
        
        editor.addEventListener("click", function(e) {
            var pos = e.getDocumentPosition();
            var doc = editor.session.doc;
            
            ide.dispatchEvent("codetools.codeclick", {
                amlEditor: amlEditor,
                editor: editor,
                pos: pos,
                doc: doc
            });
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