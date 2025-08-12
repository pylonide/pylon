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
var markup = require("text!ext/hexview/hexview.xml");
var skin    = require("text!ext/hexview/skin.xml");
var css     = require("text!ext/hexview/style/style.css");
var markupSettings = require("text!ext/hexview/settings.xml");

var $name = "ext/hexview/hexview";

module.exports = ext.register($name, {
    name    : "Hexview",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    $name   : $name,
    $button : "pgHexview",
    skin    : {
        id   : "hexviewskin",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/hexview/style/images/",
        "icon-path"  : ide.staticPrefix + "/ext/hexview/style/icons/"
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
                "class" : "hexview",
                tooltip : "Hexview in browser",
                caption : "Hexview",
                disabled : true,
                onclick : function() {
                  if(_self.isVisible()) {
                    _self.close();
                    return;
                  }
                  var page = ide.getActivePage();
                  if (page.$editor === _self)
                    return;
                  var doc = page.$doc;
                  var path = doc.getNode().getAttribute("path");
                  /* Construct URI for Hex viewer */
                  var url = location.protocol + "//" + location.host + "/static/hex?web=" + location.protocol + "//" + location.host + path;
                  _self.hexview(url, {path: path, value: doc.getValue()});
                }
            }), 10)
        );

        dock.addDockable({
            expanded : -1,
            width : 400,
            "min-width" : 400,
            barNum: 4,
            headerVisibility: "false",
            sections : [{
                width : 360,
                height: 300,
                buttons : [{
                    caption: "Hexview Apps",
                    ext : [this.$name, this.$button],
                    hidden : false
                }]
            }]
        });

        dock.register(this.$name, this.$button, {
            menu : "Hexview Apps",
            primary : {
                backgroundImage: ide.staticPrefix + "/ext/main/style/images/sidebar_preview_icon.png",
                defaultState: { x: -11, y: -10 },
                activeState:  { x: -11, y: -46 }
            }
        }, function() {
            ext.initExtension(_self);
            return pgHexview;
        });

        ide.addEventListener("tab.afterswitch", function(e){
            _self.enable();
        });

        ide.addEventListener("closefile", function(e){
            if (tabEditors.getPages().length == 1)
                _self.disable();
        });

        ide.addEventListener("settings.save", function(e){
            if (_self.inited) {
                var url = txtHexview.getValue();
                if (url) {
                    var prev = {
                        visible: _self.isVisible(),
                        url: url,
                        live: _self.live && {path: _self.live.path}
                    };
                    e.model.setQueryValue("auto/hexview/text()", JSON.stringify(prev));
                }
            }
        });

        ide.addEventListener("extload", function(e){
            ide.addEventListener("settings.load", function(e){
                settings.setDefaults("hexview", [
                    ["running_app", "false"]
                ]);

                var json = e.model.queryValue("auto/hexview/text()");
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
        if (pNode.children.length === 4) {
            pNode.removeChild(pNode.children[2]);
            pNode.children[2].style.top = 0;
        }
    },

    hexview: function (url, live) {
      try {
        var sab = new SharedArrayBuffer(1024);
        if(sab===undefined) throw new Error("Not supported");
        else {
          var bar = this._getDockBar();
          dock.showBar(bar);
          dock.expandBar(bar);
          dock.showSection(this.$name, this.$button);
          this.hidePageHeader();
          var frmHexview = this.getIframe();
          if (frmHexview.$ext.src !== url) {
            this.refresh(url);
          }
          this.live = live;
        }
      }
      catch(e) {
        console.log("Browser does not support SharedArrayBuffer: " + e);
      }
    },

    popup: function (url) {
        url = url || txtHexview.getValue();
        window.open(url, "_blank");
    },

    refresh: function (url) {
        var frmHexview = this.getIframe();
        url = url || txtHexview.getValue();
        frmHexview.$ext.src = url;
        txtHexview.setValue(url);
        settings.save();
    },

    close: function () {
        dock.hideSection(this.$name, this.$button);
        this.live = null;
        settings.save();
    },

    init: function() {
        ppc.importCssString(this.css || "");
    },

    getIframe: function() {
        return pgHexview.selectSingleNode("iframe");
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