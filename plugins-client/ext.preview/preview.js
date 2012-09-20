/**
 * App or HTML previewer in Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var menus = require("ext/menus/menus");
var markup = require("text!ext/preview/preview.xml");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/preview/preview", {
    name    : "Preview",
    dev     : "Ajax.org",
    fileExtensions : [ "#!preview" ],
    type    : ext.EDITOR,
    alone   : true,
    markup  : markup,
    deps    : [editors],
    autodisable : ext.ONLINE | ext.LOCAL,

    counter : 0,
    nodes : [],

    setDocument : function(doc, actiontracker) {
        var node = doc.getNode();
        doc.editor = this;
        var path = node.getAttribute("path");
        node.setAttribute("name", node.getAttribute("name").split(".#!preview")[0]);
        var url = path.substring(0, path.length - 10);
        frmPreview.$ext.src = url;
        txtPreviewURL.setValue(url);
        if (!doc.preview)
            doc.preview = {fd: ++this.counter};
        var editor = barPreview;
        editor.show();
    },

    hook : function() {
        var _self = this;

        this.nodes.push(
            menus.$insertByIndex(barTools, new apf.button({
                skin : "c9-toolbarbutton-glossy",
                //icon : "preview.png",
                "class" : "preview",
                tooltip : "Preview in browser",
                caption : "Preview",
                disabled : true,
                onclick : function(){
                    var page = tabEditors.getPage();
                    if (page.$editor === _self)
                        return;
                    var file = page.$model.data;
                    var url = location.protocol + "//" + location.host + file.getAttribute("path");
                    _self.preview(url);
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
    },

    preview : function (url) {
        // window.open(url, "_blank");
        editors.gotoDocument({
            path: url + ".#!preview",
            type: "nofile"
        });
    },

    init : function(){
        var _self = this;
        var editor = barPreview;
        this.enabled = false;
    },

    getState : function(doc){
        if (!doc.preview)
            return;

        return {
            "fd": doc.preview.fd,
            "width": barPreview.lastWidth || barPreview.getWidth(),
            "height": barPreview.lastHeight || barPreview.getHeight(),
            "type": "nofile"
        };
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