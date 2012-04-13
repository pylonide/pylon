/**
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");

module.exports = ext.register("ext/tools/tools", {
    name     : "Tools Menu",
    dev      : "Cloud9 IDE, Inc.",
    alone    : true,
    type     : ext.GENERAL,

    nodes : [],

    init : function(){
        this.nodes.push(
            barMenu.appendChild(new apf.button({
                skin : "c9-menu-btn",
                submenu : "mnuTools",
                margin : "1 0 0 0",
                caption : "Tools"
            })),
            
            apf.document.body.appendChild(new apf.menu({
                id : "mnuTools"
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
    }
});

});