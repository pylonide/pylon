/**
 * PDF Viewer for the Cloud9 IDE
 *
 * @author Garen J. Torikian
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/pdfviewer/pdfviewer.xml");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/pdfviewer/pdfviewer", {
    name    : "PDF Viewer",
    dev     : "Garen J. Torikian",
    fileExtensions : ["pdf"],
    type    : ext.EDITOR,
    markup  : markup,
    deps    : [editors],

    nodes : [],

    setDocument : function(doc, actiontracker){
        doc.session = doc.getNode().getAttribute("path");
        pdfEditor.setProperty("value", apf.escapeXML(doc.session));
        if (!doc.isInited) {
            doc.isInited = true;
            doc.dispatchEvent("init");
        }
    },

    hook : function() {},

    init : function() {
        var editor = pdfEditor;

        editor.show();

        this.pdfEditor = this.amlEditor = editor;
    },

    enable : function() {
        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function() {
        this.nodes.each(function(item){
            item.hide();
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
