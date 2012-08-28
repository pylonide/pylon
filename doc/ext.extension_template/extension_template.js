/**
 * Extension Template for Cloud9 IDE
 * 
 * Inserts a context menu item under the "Edit" menu, which, when
 * clicked, displays a simple window with a "Close" button.
 * 
 * This file is stripped of comments in order to provide a quick template for 
 * future extensions. Please reference our documentation for a list of what's
 * going on.
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");

var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var markup = require("text!ext/extension_template/extension_template.xml");

module.exports = ext.register("ext/extension_template/extension_template", {
    name     : "Extension Template",
    dev      : "Ajax.org",
    alone    : true,
    deps     : [],
    type     : ext.GENERAL,
    markup   : markup,

    nodes : [],

    init : function(){
        var _self = this;
        this.winExtensionTemplate = winExtensionTemplate;
        
        commands.addCommand({
            name: "sayhello",
            hint: "I'll say something",
            msg: "Popping window!",
            bindKey: {mac: "Shift-1", win: "Ctrl-1"},
            isAvailable : function() {
                return true;    
            },
            exec: function() {
                _self.winExtensionTemplate.show()
            }
        });
        
        this.nodes.push(
            menus.addItemByPath("Edit/Extension Template", new apf.item({
                command : "sayhello"
            }), 5400)
        ); 

       /* Just a plain menu...
        this.nodes.push(
            menus.addItemByPath("Edit/Extension Template", new apf.item({
                onclick : function(){
                    _self.winExtensionTemplate.show();
                }
            }), 5400)
        ); */
    },

    hook : function(){
        var _self = this;
        ext.initExtension(this);
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