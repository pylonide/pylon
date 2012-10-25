/**
 * App or HTML previewer in Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var menus = require("ext/menus/menus");
var markup = require("text!ext/preview/preview.xml");
var editors = require("ext/editors/editors");
var splits = require("ext/splitview/splits");
var skin    = require("text!ext/preview/skin.xml");
var css     = require("text!ext/preview/style/style.css");

module.exports = ext.register("ext/preview/preview", {
    name    : "Preview",
    dev     : "Ajax.org",
    fileExtensions : [ "#!preview" ],
    type    : ext.EDITOR,
    alone   : true,
    markup  : markup,
    skin    : {
        id   : "previewskin",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/preview/style/images/",
        "icon-path"  : ide.staticPrefix + "/ext/preview/style/icons/"
    },
    css   : util.replaceStaticPrefix(css),
    deps    : [editors],
    autodisable : ext.ONLINE | ext.LOCAL,
    hidePage : true,
    counter : 0,
    nodes : [],
    disableLut: {
        "terminal": true
    },
    popups: [],
    page: null,
    splits: [],

    setDocument : function(doc, actiontracker) {
        var node = doc.getNode();
        var page = this.page = doc.$page;
        page.$button.style.display = "none";
        doc.editor = this;
        var path = node.getAttribute("path");
        node.setAttribute("name", "Preview: " + apf.getFilename(path).split(".#!preview")[0]);
        var url = path.substring(0, path.length - 10);
        var frmPreview = this.getIframe();
        if (frmPreview.$ext.src !== url)
            this.refresh(url);
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

        ide.addEventListener("tab.afterswitch", function(e){
            _self.enable();
        });
        ide.addEventListener("closefile", function(e){
            if (tabEditors.getPages().length == 1)
                _self.disable();
        });

        ide.addEventListener("afterfilesave", function(e) {
            if (!_self.popups.length)
                return;
            _self.popups = _self.popups.filter(function (popup) {
                return !! popup.Array;
            });
            _self.popups.forEach(function(popup) {
                popup.location.reload();
            });
        });

        ide.addEventListener("splits.mutate", function(e) {
            if (e.page.$editor !== _self) {
                if (e.action === "remove")
                    editors.close(e.split.pairs[0].page);
                return;
            }
            if (e.action === "add")
                _self.splits.push(e.split);
            else if (e.action === "remove")
                _self.splits.remove(e.split);
        });
    },

    preview : function (url, tabView) {
        // window.open(url, "_blank");
        var page = tabEditors.getPage();
        var path = url + ".#!preview";
        editors.gotoDocument({
            path: path,
            type: "nofile",
            active: !!tabView
        });
        if (!tabView) {
            setTimeout(function() {
                splits.mutate(null, tabEditors.getPage(path));
                splits.update(splits.getActive());
            });
        }
    },

    popup: function (url) {
        url = url || txtPreview.getValue();
        var w = window.open(url, "_blank");
        this.popups.push(w);
    },

    refresh: function (url, focus) {
        var frmPreview = this.getIframe();
        if (!frmPreview || !this.page)
            return;
        url = url || txtPreview.getValue();
        this.page.setAttribute("class", "loading_active");
        frmPreview.$ext.src = url;
        txtPreview.setValue(url);
        if (focus)
            tabEditors.set(this.page);
    },

    close: function () {
        this.page && editors.close(this.page);
    },

    init : function(){
        var editor = this.amlEditor = barPreview;
        this.enabled = false;
        apf.importCssString(this.css || "");
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
