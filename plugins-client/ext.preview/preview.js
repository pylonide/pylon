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
var settings = require("ext/settings/settings");
var menus = require("ext/menus/menus");
var dock = require("ext/dockpanel/dockpanel");
var editors = require("ext/editors/editors");
var markup = require("text!ext/preview/preview.xml");
var skin    = require("text!ext/preview/skin.xml");
var css     = require("text!ext/preview/style/style.css");
var markupSettings = require("text!ext/preview/settings.xml");

var $name = "ext/preview/preview";

module.exports = ext.register($name, {
    name    : "Preview",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    $name   : $name,
    $button : "pgPreview",
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
    live    : null,

    _getDockBar: function () {
        return dock.getBars(this.$name, this.$button)[0];
    },

    _getDockButton: function () {
        return dock.getButtons(this.$name, this.$button)[0];
    },

    onLoad: function () {

    },

    hook: function() {
        var _self = this;

        settings.addSettings("General", markupSettings);

        this.nodes.push(
            menus.$insertByIndex(barTools, new ppc.button({
                skin : "c9-toolbarbutton-glossy",
                //icon : "preview.png",
                "class" : "preview",
                tooltip : "Preview in browser",
                caption : "Preview",
                disabled : true,
                onclick : function() {
                    var page = ide.getActivePage();
                    if (page.$editor === _self)
                        return;
                    var doc = page.$doc;
                    var path = doc.getNode().getAttribute("path");
                    var url = location.protocol + "//" + location.host + path;
                    _self.preview(url, {path: path, value: doc.getValue()});
                }
            }), 10)
        );

        dock.addDockable({
            expanded : -1,
            width : 400,
            "min-width" : 400,
            barNum: 2,
            headerVisibility: "false",
            sections : [{
                width : 360,
                height: 300,
                buttons : [{
                    caption: "Preview Apps",
                    ext : [this.$name, this.$button],
                    hidden : false
                }]
            }]
        });

        dock.register(this.$name, this.$button, {
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

        ide.addEventListener("afterfilesave", _self.onFileSave.bind(_self));

        ide.addEventListener("closefile", function(e){
            if (tabEditors.getPages().length == 1)
                _self.disable();
        });

        ide.addEventListener("settings.save", function(e){
            if (_self.inited) {
                var url = txtPreview.getValue();
                if (url) {
                    var prev = {
                        visible: _self.isVisible(),
                        url: url,
                        live: _self.live && {path: _self.live.path}
                    };
                    e.model.setQueryValue("auto/preview/text()", JSON.stringify(prev));
                }
            }
        });

        ide.addEventListener("extload", function(e){
            ide.addEventListener("settings.load", function(e){
                settings.setDefaults("preview", [
                    ["running_app", "false"]
                ]);

                var json = e.model.queryValue("auto/preview/text()");
                if (json) {
                    var prev = JSON.parse(json);
                    if (prev.visible)
                        _self.refresh(prev.url, prev.live);
                }
            });
        });

        ide.addEventListener("dockpanel.loaded", function (e) {
            _self.hidePageHeader();
        });

        ext.initExtension(this);
    },

    isVisible: function () {
        var button = this._getDockButton();
        return button && button.hidden && button.hidden === -1;
    },

    // Patch the docked section to remove the page caption
    hidePageHeader: function () {
        var button = this._getDockButton();
        if (!button || !button.cache)
            return;
        var pNode = button.cache.$dockpage.$pHtmlNode;
        // Find and hide the caption element by class instead of
        // removing by index, which could destroy the iframe.
        for (var i = 0; i < pNode.children.length; i++) {
            var child = pNode.children[i];
            if (child.className && child.className.indexOf('docktab_page_caption') !== -1) {
                child.style.display = 'none';
                // Expand the content area below to fill the space
                var next = pNode.children[i + 1];
                if (next) next.style.top = '0';
                break;
            }
        }
    },

    onFileSave: function () {
        if (!this.live)
            return;
        var _self = this;
        var page = tabEditors.getPages().filter(function (page) {
            return _self.live.path === page.$doc.getNode().getAttribute("path");
        })[0];
        if (page)
            this.live.value = page.$doc.getValue();
        var frm = this.getIframe();
        if (!frm || !frm.$browser || !frm.$browser.contentWindow)
            return;
        var html = frm.$browser.contentWindow.document.getElementsByTagName("html")[0];
        html.innerHTML = this.live.value;
    },

    preview: function (url, live) {
        var bar = this._getDockBar();
        dock.showBar(bar);
        dock.expandBar(bar);
        dock.showSection(this.$name, this.$button);
        this.hidePageHeader();
        var frm = this.getIframe();
        if (frm && frm.$browser && frm.$browser.src !== url)
            this.refresh(url);
        this.live = live;
    },

    popup: function (url) {
        url = url || txtPreview.getValue();
        window.open(url, "_blank");
    },

    refresh: function (url) {
        var frm = this.getIframe();
        if (!frm) return;
        url = url || txtPreview.getValue();
        frm.$browser.src = url;
        txtPreview.setValue(url);
        settings.save();
    },

    close: function () {
        dock.hideSection(this.$name, this.$button);
        this.live = null;
        settings.save();
    },

    init: function() {
        ppc.importCssString(this.css || "");

        // Size the browser iframe to fill the page below the toolbar.
        // PPC page elements don't support flexbox so we calculate
        // the height dynamically based on the docktab container.
        var fixSize = function() {
            if (typeof frmPreview === 'undefined' || !frmPreview.$ext ||
                typeof pgPreview === 'undefined' || !pgPreview.$ext) {
                setTimeout(fixSize, 200);
                return;
            }

            var iframe = frmPreview.$ext;
            iframe.style.border = 'none';
            iframe.style.width = '100%';

            var resize = function() {
                // Find the docktab ancestor to get the available height
                var el = pgPreview.$ext;
                while (el && !(el.className || '').match(/docktab/)) {
                    el = el.parentElement;
                }
                if (!el) return;
                var availH = el.getBoundingClientRect().height;
                // 36px for the toolbar bar
                iframe.style.height = Math.max(0, availH - 36 - 28) + 'px';
            };

            resize();
            // Re-size when window resizes
            window.addEventListener('resize', resize);
            // Also periodically check in case dock panel is resized
            setInterval(resize, 500);
        };
        fixSize();
    },

    getIframe: function() {
        // frmPreview is the PPC browser element defined in preview.xml
        return typeof frmPreview !== 'undefined' ? frmPreview : null;
    },

    enable : function() {
        var page = ide.getActivePage();
        var contentType = (page && page.getModel().data.getAttribute("contenttype")) || "";
        if(this.disableLut[contentType])
            return this.disable();
        this.$enable();
    },

    disable: function() {
        this.live = null;
        this.$disable();
    }
});

});
