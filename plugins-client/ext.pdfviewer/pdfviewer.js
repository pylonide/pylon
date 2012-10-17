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
require("ext/pdfviewer/pdf"); 
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
        window.PDFJS.getDocument(apf.escapeXML(doc.session)).then(function(pdf) {
          // Using promise to fetch the page
          pdf.getPage(1).then(function(page) {
            var scale = 1.5;
            var viewport = page.getViewport(scale);
        
            //
            // Prepare canvas using PDF page dimensions
            //
            var canvas = document.getElementById('pdfEditor');
            var context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
        
            //
            // Render PDF page into canvas context
            //
            var renderContext = {
              canvasContext: context,
              viewport: viewport
            };
            page.render(renderContext);
          });
        });
    },

    focus : function(){
        barPDF.focus();
        var page = tabEditors.getPage();
        if (!page) return;

        var doc = page.$doc;
    },
    
    hook : function() {},

    init : function() {
        var _self = this;

        window.PDFJS.workerSrc = ide.staticPrefix + "/ext/pdfviewer/pdf.js";

        var editor = barPDF;

        ide.addEventListener("beforefilesave", function(e) {
            var path = e.node && e.node.getAttribute("path");
            if (!path)
                return;
            // don't save images for now.
            if (editor.value == path)
                return false;
        });

        barPDF.addEventListener("blur", function(){
            //PDFJS.focus = null;
            //var cursor = document.querySelector(".terminal .reverse-video");
            //if (cursor && apf.isTrue(settings.model.queryValue("auto/terminal/blinking")))
            //    cursor.parentNode.removeChild(cursor);
            barPDF.setAttribute("class", "c9pdfviewer");
        });

        barPDF.addEventListener("focus", function(){
            barPDF.setAttribute("class", "c9pdfviewer c9pdfviewerFocus");
        });

        pdfEditor.addEventListener("click", function(e) {
            _self.focus();
        });

        pdfEditor.addEventListener("onscroll", function(e) {
            alert("SFD")
        });

        editor.show();

        this.barPDF = this.amlEditor = editor;
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
