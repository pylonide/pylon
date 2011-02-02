/**
 * Dock Panel (v2) for the Cloud9 IDE client
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var markup = require("text!ext/dockpanel2/dockpanel2.xml");
        
return ext.register("ext/dockpanel2/dockpanel2", {
    name     : "Dock Panel v2",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,

    nodes : [],

    init : function(amlNode){
    },

    hook : function(){
        var _self = this;
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
});

    }
);