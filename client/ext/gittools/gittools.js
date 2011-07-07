/**
 * Git Tools for the Cloud9 IDE client
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var dock = require("ext/dockpanel/dockpanel");
var markup = require("text!ext/gittools/gittools.xml");

return ext.register("ext/gittools/gittools", {
    name     : "Git Tools",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,

    nodes : [],

    init : function(amlNode){
        this.section = dock.getSection("gittools", {
            width  : 260,
            height : 360
        });

        dock.registerPage(this.section, tabGitTools.firstChild, null, {
            primary : {
                backgroundImage: "/static/style/images/debugicons.png",
                defaultState: { x: -6, y: -217 },
                activeState: { x: -6, y: -217 }
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
    }
});

    }
);