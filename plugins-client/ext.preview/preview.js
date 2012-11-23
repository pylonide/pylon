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
var dock = require("ext/dockpanel/dockpanel");
var editors = require("ext/editors/editors");
var markup = require("text!ext/preview/preview.xml");
var skin    = require("text!ext/preview/skin.xml");
var css     = require("text!ext/preview/style/style.css");

var _name = "ext/preview/preview";

module.exports = ext.register(_name, {
    name    : "Preview",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    _name   : _name,
    skin    : {
        id   : "previewskin",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/preview/style/images/",
        "icon-path"  : ide.staticPrefix + "/ext/preview/style/icons/"
    },
    css     : util.replaceStaticPrefix(css),
    deps    : [editors],
    autodisable : ext.ONLINE | ext.LOCAL,
    disableLut: {
        "terminal": true
    },
    nodes   : [],

    _getDockButton: function() {
        var buttons = dock.getButtons(this._name);
        if (buttons)
            return buttons[0].cache;
    },

    _getDockBar: function () {
        return dock.getBars(this._name, "pgPreview")[0];
    },

    onLoad: function () {
        
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
                onclick : function() {
                    var page = tabEditors.getPage();
                    if (page.$editor === _self)
                        return;
                    var file = page.$model.data;
                    var url = location.protocol + "//" + location.host + file.getAttribute("path");
                    _self.preview(url);
                }
            }), 10)
        );

        dock.addDockable({
            expanded : -1,
            width : 400,
            "min-width" : 400,
            barNum: 2,
            sections : [{
                width : 360,
                height: 300,
                buttons : [{
                    caption: "Preview Apps",
                    ext : [this._name, "pgPreview"],
                    hidden : false
                }]
            }]
        });

        dock.register(this._name, "pgPreview", {
            menu : "Preview Apps",
            primary : {
                backgroundImage: ide.staticPrefix + "/ext/main/style/images/sidebar_preview_icon.png",
                defaultState: { x: -11, y: -10 },
                activeState:  { x: -11, y: -46 }
            }
        }, function() {
            ext.initExtension(_self);
            return pgPreview;
        });

        ide.addEventListener("tab.afterswitch", function(e){
            _self.enable();
        });

        ide.addEventListener("closefile", function(e){
            if (tabEditors.getPages().length == 1)
                _self.disable();
        });

        ext.initExtension(this);
    },

    preview : function (url) {
        // window.open(url, "_blank");
        pgPreview.setCaption(apf.getFilename(url));
        var bar = this._getDockBar();
        dock.showBar(bar);
        dock.expandBar(bar);
        dock.showSection(this._name, "pgPreview");
        var frmPreview = this.getIframe();
        if (frmPreview.$ext.src !== url)
            this.refresh(url);
    },

    popup: function (url) {
        url = url || txtPreview.getValue();
        var w = window.open(url, "_blank");
    },

    refresh: function (url) {
        var frmPreview = this.getIframe();
        url = url || txtPreview.getValue();
        pgPreview.setAttribute("class", "loading_active");
        frmPreview.$ext.src = url;
        txtPreview.setValue(url);
    },

    close: function () {
        dock.hideSection(this._name, "pgPreview");
    },

    init : function() {
        apf.importCssString(this.css || "");
    },

    getIframe: function(editor) {
        return pgPreview.selectSingleNode("iframe");
    },

    enable : function() {
        var page = tabEditors.getPage();
        var contentType = (page && page.getModel().data.getAttribute("contenttype")) || "";
        if(this.disableLut[contentType])
            return this.disable();
        this.$enable();
    }
});

});
