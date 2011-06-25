/**
 * Extension Template for the Cloud9 IDE client
 * 
 * Inserts a context menu item under the "Edit" menu, which, upon being
 * clicked displays a simple window with a "Close" button
 * 
 * This file is stripped of comments from extension_template.js in order to
 * provide a quick template for future extensions. Please reference
 * extension_template.js to see comprehensive documentation of extension
 * functionality
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var markup = require("text!ext/scala/scala.xml");

return ext.register("ext/scala/scala", {
    name     : "Scala Editor",
    dev      : "btilford",
    alone    : true,
    type     : ext.EDITOR,
    //deps    : [code],
    markup  : markup,
    contentTypes : [
        "text/scala"
    ],
    nodes : [],

    init : function(amlNode){
        this.scalaWindow = ScalaWindow;
    },

    hook : function(){
        var _self = this;
        tabEditors.addEventListener("afterswitch", function(e){
            var mime = e.nextPage.contentType;
            if (mime == "text/scala") {
                ext.initExtension(_self);
                _self.page = e.nextPage;
                _self.enable();
            }
            else {
                _self.disable();
            }
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
    },

     closeScalaWindow : function(){
        this.scalaWindow.hide();
     }
});

    }
);