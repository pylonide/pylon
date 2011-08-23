/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/imgview/imgview.xml");
var editors = require("ext/editors/editors");

var ImageTypes = {
    "image/bmp": "bmp",
    "image/vnd.djvu": "djv",
    "image/vnd.djvu": "djvu",
    "image/gif": "gif",
    "image/vnd.microsoft.icon": "ico",
    "image/jpeg": "jpeg",
    "image/jpeg": "jpg",
    "image/x-portable-bitmap": "pbm",
    "image/x-portable-graymap": "pgm",
    "image/png": "png",
    "image/x-portable-anymap": "pnm",
    "image/x-portable-pixmap": "ppm",
    "image/vnd.adobe.photoshop": "psd",
    "image/svg+xml": "svg",
    "image/svg+xml": "svgz",
    "image/tiff": "tif",
    "image/tiff": "tiff",
    "image/x-xbitmap": "xbm",
    "image/x-xpixmap": "xpm"
};

module.exports = ext.register("ext/imgview/imgview", {
    name    : "Image Viewer",
    dev     : "Ajax.org",
    contentTypes : Object.keys(ImageTypes),
    type    : ext.EDITOR,
    markup  : markup,
    deps    : [editors],

    nodes : [],

    setDocument : function(doc, actiontracker){
        imgEditor.setProperty("value", doc.getNode().getAttribute("path"));
    },

    hook : function() {

    },

    init : function(amlPage) {
        amlPage.appendChild(imgEditor);
        imgEditor.show();

        this.imgEditor = imgEditor;
        //this.nodes.push();
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
