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

var previewExtensions = [
    "htm", "html", "xhtml",
    "conf", "log", "text", "txt",
    "xml", "xsl"
];

module.exports = ext.register("ext/html/html", {
    name  : "HTML Editor",
    dev   : "Ajax.org",
    type  : ext.GENERAL,
    alone : true,
    deps  : [code],
    nodes : [],

    afterSwitchOrOpen : function(node) {
        var name = node.$model.data.getAttribute("name");
        var fileExtension = name.split(".").pop();

        if (previewExtensions.indexOf(fileExtension) > -1) {
            //ext.initExtension(this);
            this.page = node;
            this.enable();
        }
        else {
            this.disable();
        }
    },

    init : function(){
        var _self = this;
        
        this.nodes.push(
//            menus.$insertByIndex(barTools, new apf.divider({
//                skin : "c9-divider"
//            }), 300),
            
            menus.$insertByIndex(barTools, new apf.button({
                skin : "c9-toolbarbutton",
                //icon : "preview.png" ,
                "class" : "preview",
                tooltip : "Preview in browser",
                caption : "Preview",
                disabled : true,
                onclick : function(){
                    var file = _self.page.$model.data;
                    window.open(location.protocol + "//" 
                        + location.host + file.getAttribute("path"), "_blank");
                }
            }), 10)
        );
        
        ide.addEventListener("init.ext/editors/editors", function(e) {
            tabEditors.addEventListener("afterswitch", function(e){
                _self.afterSwitchOrOpen(e.nextPage);
            });
            ide.addEventListener("closefile", function(e){
                if (tabEditors.getPages().length == 1)
                    _self.disable();
            });
            ide.addEventListener("afteropenfile", function(e){
                // Only listen for event from editors.js
                if (e.editor && e.node.$model)
                    _self.afterSwitchOrOpen(e.node);
            });
            ide.addEventListener("updatefile", function(e) {
                var page = tabEditors.getPage(e.newPath);
                if (!page || !page.$active)
                    return;
                _self.afterSwitchOrOpen(page);
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
