/**
 * Minimap extension for Cloud9 IDE
 * 
 * @author Sergi Mansilla
 * @contributor Matt Pardee
 * @copyright 2012, Cloud9 IDE, Inc.
 */
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var Map = require("ext/minimap/map");
var css = require("text!ext/minimap/style.css");

return module.exports = ext.register("ext/minimap/minimap", {
    name  : "Minimap",
    dev   : "Cloud9 IDE, Inc.",
    type  : ext.GENERAL,
    alone : true,
    commands : {
        "minimap": {
            hint: "Hide or show the code minimap"
        }
    },
    nodes   : [],
    deps    : [editors],
    css     : css,
    map_width : 165,
    map_enabled : false,

    hook : function() {
        var _self = this;
        this.menuItem = new apf.item({
            id      : "mnuItemShowMinimap",
            type    : "check",
            caption : "Show Minimap",
            checked : "[{require('ext/settings/settings').model}::editors/code/@minimap]",
            onclick : function() {
                _self.toggle();
            }
        });

        this.nodes.push(mnuView.appendChild(this.menuItem));

        ide.addEventListener("afteropenfile", function() {
            ext.initExtension(_self);
            if (_self.editor)
                _self.updateMap();
        });

        ide.addEventListener("loadsettings", function(e) {
            _self.map_enabled = e.model.queryValue("editors/code/@minimap");
        });
        
        tabEditors.addEventListener("afterswitch", function(){
            if(_self.initFail && !_self.initDone) {
                setTimeout(function(){
                        _self.initFail = false;
                        _self.init();
                }, 200);
            }
        });
    },

    init : function() {
        var _self = this;
        
        if(typeof ceEditor === "undefined") {
            this.initFail = true;
            return;
        }
        
        apf.importCssString((this.css || ""));

        this.editor = ceEditor.$editor;
        this.panel = ceEditor.parentNode.appendChild(new apf.bar({
            id : "minimapPanel",
            visible : false,
            top : 2,
            bottom : 0
        }));

        this.panel.$ext.style.right = "0";
        this.panel.$ext.style.webkitTextSizeAdjust = "none";
        this.canvas = document.createElement("canvas");
        this.panel.$ext.appendChild(this.canvas);
        this.visor = document.createElement("div");
        this.visor.setAttribute("id", "minimapVisor");
        this.panel.$ext.appendChild(this.visor);
        this.map = new Map(this.editor, this.canvas, this.visor);

        tabPlaceholder.addEventListener("resize", function() {
            if (_self.panel.visible)
                _self.map.resize(_self.map_width, ceEditor.getHeight());
        });

        tabEditors.addEventListener("afterswitch", function() {
            _self.updateMap();
            setTimeout(function() {
                _self.setupChangeListener();
            }, 200);
        });

        if (apf.isTrue(this.map_enabled)) {
            setTimeout(function() {
                _self.show();
            });
        }

        this.setupChangeListener();
        
        this.initDone = true;
    },
    
    setupChangeListener : function() {
        if (this.$changeEvent)
            this.editorSession.removeEventListener("change", this.$changeEvent);

        var _self = this;
        if(editors.currentEditor.ceEditor) {
            this.editorSession = editors.currentEditor.ceEditor.$editor.session;
            this.editorSession.addEventListener("change", this.$changeEvent = function() {
                if (_self.$updateTimer)
                    clearTimeout(_self.$updateTimer);
                _self.$updateTimer = setTimeout(function() {
                    _self.updateMap();
                }, 100);
            });
        }
    },

    // Support for CLI
    minimap : function() {
        mnuItemShowMinimap.dispatchEvent("click");
    },

    toggle : function() {
        if (apf.isTrue(this.map_enabled))
            this.hide();
        else
            this.show();
    },

    show : function() {
        this.editor.container.style.right = this.map_width + "px";
        this.panel.show();
        this.updateMap();
        this.map_enabled = true;

        ide.dispatchEvent("minimap.visibility", {
            visibility: "shown",
            width : this.map_width
        });
    },

    /**
     * Hide minimap
     * 
     * @param {boolean} noSetMapEnabled Whether to set `map_enabled`
     * @see this.disable()
     */
    hide : function(noSetMapEnabled) {
        this.panel.hide();
        this.editor.container.style.right = "0";

        if (!noSetMapEnabled)
            this.map_enabled = false;

        ide.dispatchEvent("minimap.visibility", {
            visibility: "hidden"
        });
    },

    updateMap : function() {
        if (this.panel.visible)
            this.map.updateSource(this.editor.getSession());
    },

    enable: function() {
        this.menuItem.show();

        if (this.map_enabled)
            this.show();
    },

    disable: function() {
        this.menuItem.hide();

        // We don't want to set the map_enabled var when disabling,
        // because when it's re-enabled we want it to re-appear if
        // map_enabled was originally set to true
        this.hide(true);
    },

    destroy: function() {
        this.nodes.each(function(item) {
            return item.destroy();
        });
        this.nodes = [];
        this.map.destroy();
        this.map = null;
        this.panel.destroy(true, true);
    }
});
});
