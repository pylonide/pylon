/**
 * HTML Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var code = require("ext/code/code");
var menus = require("ext/menus/menus");

module.exports = ext.register("ext/html/html", {
    name  : "HTML Editor",
    dev   : "Ajax.org",
    type  : ext.GENERAL,
    alone : true,
    deps  : [code],
    nodes : [],
    autodisable : ext.ONLINE | ext.LOCAL,
    
    init : function(){
        var _self = this;
        
        this.nodes.push(
            menus.$insertByIndex(barTools, new apf.button({
                skin : "c9-toolbarbutton-glossy",
                //icon : "preview.png" ,
                "class" : "preview",
                tooltip : "Preview in browser",
                caption : "Preview",
                disabled : true,
                onclick : function(){
                    var file = tabEditors.getPage().$model.data;
                    window.open(location.protocol + "//" 
                        + location.host + file.getAttribute("path"), "_blank");
                }
            }), 10)
        );
        
        ide.addEventListener("init.ext/editors/editors", function(e) {
            ide.addEventListener("tab.afterswitch", function(e){
                _self.enable();
            });
            ide.addEventListener("closefile", function(e){
                if (tabEditors.getPages().length == 1)
                    _self.disable();
            });
        });

        this.enabled = false;
    },

    enable : function() {
        if (this.enabled)
            return;
        this.enabled = true;

        this.nodes.each(function(item){
            item.enable && item.enable();
        });
    },

    disable : function(){
        if (!this.enabled)
            return;
        this.enabled = false;

        this.nodes.each(function(item){
            item.disable && item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy && item.destroy(true, true);
        });
        this.nodes = [];
    }
});
});
