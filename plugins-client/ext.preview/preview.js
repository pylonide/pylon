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
var splits = require("ext/splitview/splits");

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
    disableLut: {
        "terminal": true
    },
    popups: [],
    page: null,

    setDocument : function(doc, actiontracker) {
        var node = doc.getNode();
        var page = this.page = doc.$page;
        doc.editor = this;
        var path = node.getAttribute("path");
        node.setAttribute("name", "Preview: " + node.getAttribute("name").split(".#!preview")[0]);
        var url = path.substring(0, path.length - 10);
        var frmPreview = this.getIframe();
        if (frmPreview.$ext.src !== url) {
            // onload is fired when the url changes
            page.setAttribute("class", "loading_active");
            frmPreview.$ext.src = url;
            this.getTextbox().setValue(url);
        }
        if (!doc.preview)
            doc.preview = {fd: ++this.counter};
        this.amlEditor.show();
    },

    onLoad: function () {
        if (this.page)
            this.page.setAttribute("class", "");
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

        ide.addEventListener("afterfilesave", function(e) {
            if (!_self.popups.length)
                return;
            // var path = e.node.getAttribute("path");
            _self.popups = _self.popups.filter(function (popup) {
                return !! popup.Array;
            });
            _self.popups.forEach(function(popup) {
                popup.location.reload();
            });
        });

        ide.addEventListener("splits.mutate", function(e) {
            console.log("closing: ",e.action, e.page.$editor === _self);
            if (e.action == "remove" && e.page.$editor === _self)
                editors.close(e.page);
        });
    },

    preview : function (url) {
        // window.open(url, "_blank");
        var path = url + ".#!preview";
        editors.gotoDocument({
            path: path,
            type: "nofile",
            active: false
        });
        setTimeout(function() {
            splits.mutate(null, tabEditors.getPage(path));
            splits.update(splits.getActive());
        });
    },

    popup: function (url) {
        url = url || this.getTextbox().getValue();
        var w = window.open(url);
        this.popups.push(w);
    },

    init : function(){
        var editor = this.amlEditor = barPreview;
        this.enabled = false;
    },

    getTextbox: function(editor) {
        editor = editor || this.amlEditor;
        return editor.selectSingleNode("//a:textbox");
    },

    getIframe: function(editor) {
        editor = editor || this.amlEditor;
        return editor.selectSingleNode("iframe");
    },

    getState : function(doc){
        if (!doc.preview)
            return;

        return {
            "fd": doc.preview.fd,
            "width": this.amlEditor.lastWidth || this.amlEditor.getWidth(),
            "height": this.amlEditor.lastHeight || this.amlEditor.getHeight(),
            "type": "nofile"
        };
    },

    enable : function() {
        var page = tabEditors.getPage();
        var contentType = (page && page.getModel().data.getAttribute("contenttype")) || "";
        if(this.disableLut[contentType])
            return this.disable();
        
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
