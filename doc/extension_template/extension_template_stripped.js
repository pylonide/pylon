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
var markup = require("text!ext/extension_template/extension_template.xml");

module.exports = ext.register("ext/extension_template/extension_template", {
    name     : "Extension Template",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,

    nodes : [],

    init : function(amlNode){
        this.winExtensionTemplate = winExtensionTemplate;
    },

    hook : function(){
        var _self = this;
        this.nodes.push(
            ide.mnuEdit.appendChild(new apf.item({
                caption : "Extension Template Window",
                onclick : function(){
                    ext.initExtension(_self);
                    _self.winExtensionTemplate.show();
                }
            }))
        );
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

     closeExtensionTemplateWindow : function(){
        this.winExtensionTemplate.hide();
     }
});

});