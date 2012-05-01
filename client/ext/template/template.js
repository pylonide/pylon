/**
 * Template extension for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/template/template.xml");
var menus = require("ext/menus/menus");

module.exports = ext.register("ext/template/template", {
    name   : "Template",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,
    markup : markup,

    nodes : [],

    hook : function(){
        var _self = this;
        
        menus.addItemByPath("Edit/Template", new apf.item({
            caption : "Template",
            onclick : function(){
                ext.initExtension(_self);
                _self.winTemplate.show();
            }
        }), 1000)
    },

    init : function(amlNode){
        this.winTemplate = winTemplate;
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
        menus.remove("Edit/Template");
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
        this.winTemplate.destroy(true, true);
    }
});

});