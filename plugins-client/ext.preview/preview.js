/**
 * HTML Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var code = require("ext/code/code");
var menus = require("ext/menus/menus");
var markup = require("text!ext/preview/preview.xml");
var css = require("text!ext/preview/styles.css");

module.exports = ext.register("ext/html/html", {
    name   : "HTML Editor",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    css    : util.replaceStaticPrefix(css),
    deps   : [code],
    nodes  : [],
    autodisable : ext.ONLINE | ext.LOCAL,
    
    init : function(){
        var _self = this;
        
        this.nodes.push(
            menus.$insertByIndex(barTools, new apf.splitbutton({
                id : "btnPreviewFile",
                //skin : "c9-toolbarbutton-glossy",
                "class" : "preview",
                tooltip : "Preview in browser",
                submenu : "mnuPreview",
                caption : "Preview",
                disabled : true,
                onclick : function(){
                    _self.previewCurrentFile();
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

        apf.importCssString(this.css);

        this.enabled = false;
    },

    previewCurrentFile : function() {
        var file = tabEditors.getPage().$model.data;
        window.open(location.protocol + "//" 
            + location.host + file.getAttribute("path"), "_blank");
    },
    
    appendMenuChild : function(child) {
        mnuPreview.appendChild(child);
    },
    
    testAppendMenuChild : function() {
        this.appendMenuChild(
            new apf.item({
                caption : "OHAI",
                submenu : "mnuContext"
            })
        );
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
