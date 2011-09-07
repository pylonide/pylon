/**
 * JavaScript Sandbox for the Cloud9 IDE client
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var dock = require("ext/dockpanel/dockpanel");
var markup = require("text!ext/sandbox/sandbox.xml");

module.exports = ext.register("ext/sandbox/sandbox", {
    name     : "JavaScript Sandbox",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,

    nodes : [],

    init : function(amlNode){},

    hook : function(){
        var _self = this;
        var name = "ext/sandbox/sandbox";

        dock.register(name, "jsSandbox", {
            menu : "Sandbox",
            primary : {
                backgroundImage: "/static/style/icons/sandbox-icon.png",
                defaultState: { x: 0, y: 0 },
                activeState: { x: 0, y: 0 }
            }
        }, function(type) {
            ext.initExtension(_self);
            return jsSandbox;
        });

        dock.addDockable({
            width : 400,
            height : 400,
            hidden  : false,
            buttons : [
                { caption: "Sandbox", ext : [name, "jsSandbox"] }
            ]
        });
    },

    evalInput : function(){
        var js = sandboxCodeEditor.getValue();
        var output = "";
        try {
            output = eval(js);
        } catch(e) {
            output = JSON.stringify(e);
        }
        sandboxOutput.setValue(output);
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });

        jsSandbox.enable();
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });

        jsSandbox.disable();
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];

        // @TODO APF does NOT remove a page if
        // scale is enabled on the tab and the page isn't visible
        jsSandbox.parentNode.remove(jsSandbox);
    }
});

});