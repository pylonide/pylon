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
        var prevRow, prevCol, multiClickTimer;

        editor.addEventListener("mousemove", function(e) {
            var pos = e.getDocumentPosition();
            var row = pos.row;
            var col = pos.column;
            var doc = editor.session.doc;
            var evObj = {
                amlEditor: amlEditor,
                editor: editor,
                pos: pos,
                doc: doc
            };
            
            if (prevRow !== row) {
                prevRow = row;
                ide.dispatchEvent("codetools.rowchange", evObj);
                // a row change is also considered a column change.
                ide.dispatchEvent("codetools.columnchange", evObj);
            }
            else if (prevCol !== col) {
                prevCol = col;
                ide.dispatchEvent("codetools.columnchange", evObj);
            }
        });
        
        editor.addEventListener("click", function(e) {
            clearTimeout(multiClickTimer);
            var pos = e.getDocumentPosition();
            var doc = editor.session.doc;
            
            multiClickTimer = setTimeout(function() {
                multiClickTimer = null;
                ide.dispatchEvent("codetools.codeclick", {
                    amlEditor: amlEditor,
                    editor: editor,
                    pos: pos,
                    doc: doc
                });
            }, 100);
        });
        
        editor.addEventListener("dblclick", function(e) {
            clearTimeout(multiClickTimer);
            multiClickTimer = null;

            var pos = e.getDocumentPosition();
            var doc = editor.session.doc;

            ide.dispatchEvent("codetools.codedblclick", {
                amlEditor: amlEditor,
                editor: editor,
                pos: pos,
                doc: doc
            });
        });
        
        function cursorChange() {
            var anchor = editor.session.selection.getSelectionAnchor();

            ide.dispatchEvent("codetools.cursorchange", {
                amlEditor: amlEditor,
                editor: editor,
                pos: {
                    row: anchor.row,
                    column: anchor.column
                },
                doc: editor.session.doc
            });
        }

        function selectionChange() {
            var anchor = editor.session.selection.getSelectionAnchor();
            var lead = editor.session.selection.getSelectionLead();

            if (anchor.row !== lead.row || Math.abs(anchor.column - lead.column) > 1) {
                ide.dispatchEvent("codetools.selectionchange", {
                    amlEditor: amlEditor,
                    editor: editor,
                    pos: {
                        start: lead,
                        end: anchor
                    },
                    doc: editor.session.doc
                });
            }
        }
        
        editor.addEventListener("changeSession", function(e) {
            if (e.oldsession) {
                e.oldsession.removeEventListener("changeCursor", cursorChange);
                e.oldsession.removeEventListener("changeSelection", selectionChange);
            }
            e.session.selection.addEventListener("changeCursor", cursorChange);
            e.session.selection.addEventListener("changeSelection", selectionChange);
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