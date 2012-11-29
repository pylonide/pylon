/**
 * richtext Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/richtext/richtext", {
    name    : "Rich Text Editor",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    contentTypes : [
        "text/html",
        "application/xhtml+xml",
        "application/rtf"
    ],
    deps    : [editors],
    nodes : [],

    init : function(amlPage){
        this.rteEditor = amlPage.appendChild(new apf.editor({
            value   : "[data]",
            anchors : "0 0 0 0"
        }));
    },

    enable : function(){
        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.hide();
        });
    },

    destroy : function(){
        if (this.rteEditor)
            this.rteEditor.destroy(true, true);
        this.$destroy();
    }
});

});