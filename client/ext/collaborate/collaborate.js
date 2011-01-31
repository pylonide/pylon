/**
 * Collaboration extension for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide    = require("core/ide");
var ext    = require("core/ext");
var util   = require("core/util");
var dock   = require("ext/dockpanel/dockpanel");
var markup = require("text!ext/collaborate/collaborate.xml");
        
return ext.register("ext/collaborate/collaborate", {
    name            : "Collaboration",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    markup          : markup,
    buttonClassName : "contact_list",
    commands        : {},
    hotitems        : {},
    
    nodes : [],

    openChat : function(listItem) {
        
    },

    hook : function(){
        var _self = this;
        dock.register(this, 1);
    },
    
    init : function(amlNode){
        this.panel = winCollaborators;
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
        dock.unregister(this);
        this.winTodo.destroy(true, true);
    }
});

    }
);