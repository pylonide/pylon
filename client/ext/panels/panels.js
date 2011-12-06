/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("core/settings");
var markup = require("text!ext/panels/panels.xml");

module.exports = ext.register("ext/panels/panels", {
    name   : "Panel Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    markup : markup,
    
    nodes : [],
    panels : {},
    
    currentPanel : null,
    
    register : function(panelExt, options){
        var _self = this;
        
        var beforePanel, diff = 10000;
        for (var path in this.panels) {
            var d = this.panels[path].$panelPosition - options.position;
            if (d > 0 && d < diff) {
                beforePanel = this.panels[path];
                diff = d;
            }
        }
        
        panelExt.mnuItem = mnuProjectBar.insertBefore(new apf.item({
            caption : panelExt.name,
            type    : "radio",
            value   : panelExt.path,
            group   : this.group,
            "onprop.selected" : function(){
                _self.activate(panelExt, true);
            }
        }), beforePanel && beforePanel.mnuItem);
        
        panelExt.button = navbar.insertBefore(new apf.button({
            skin    : "mnubtn",
            state   : "true",
            //value   : "true",
            "class" : options["class"],
            caption : options.caption
        }), beforePanel && beforePanel.button || navbar.firstChild);

        //navbar.current = this;
        panelExt.button.addEventListener("mousedown", function(e){
            var value = this.value;
            if (_self.currentPanel && (_self.currentPanel != panelExt || value)) {
                _self.deactivate(_self.currentPanel == panelExt);
                
                if (value) {
                    colLeft.hide();
                    return;
                }
            }

            _self.activate(panelExt, true);
        });
        
        this.panels[panelExt.path] = panelExt;
        panelExt.$panelPosition = options.position;
        panelExt.nodes.push(panelExt.button, panelExt.mnuItem);
        
        ide.addEventListener("init." + panelExt.path, function(e){
            panelExt.panel.setAttribute("draggable", "false");
        });
        
        if (!settings.model.queryNode("auto/panels/panel[@path='" 
            + panelExt.path + "']")) {
            settings.model.appendXml("<panel path='" 
                + panelExt.path + "' width='" 
                + panelExt.defaultWidth + "' />", "auto/panels");
        }
        
        var active = settings.model.queryValue("auto/panels/@active");
        if (panelExt["default"] && !active || active == panelExt.path)
            _self.activate(panelExt);
    },
    
    activate : function(panelExt, noButton){
        ext.initExtension(panelExt);
        
        if (this.currentPanel && (this.currentPanel != this))
            this.deactivate();
        
        var width = settings.model.queryValue("auto/panels/panel[@path='" 
            + panelExt.path + "']/@width") || panelExt.defaultWidth;
        
        panelExt.panel.show();
        colLeft.setWidth(width);
        colLeft.show();
        
        if (!noButton)
            panelExt.button.setValue(true);

        splitterPanelLeft.show();
        this.currentPanel = panelExt;
        
        settings.model.setQueryValue("auto/panels/@active", panelExt.path);
        
        ide.dispatchEvent("showpanel." + panelExt.path);
    },
    
    deactivate : function(noButton){
        if (!this.currentPanel)
            return;
        
        this.currentPanel.panel.hide();
        
        if (!noButton)
            this.currentPanel.button.setValue(false);

        splitterPanelLeft.hide();
        
        //Quick Fix
        if (apf.isGecko)
            apf.layout.forceResize(ide.vbMain.$ext);
            
        settings.model.setQueryValue("auto/panels/@active", "");
        
        ide.dispatchEvent("hidepanel." + this.currentPanel.path);
        
        this.currentPanel = null;
    },
    
    unregister : function(panelExt){
        panelExt.mnuItem.destroy(true, true);
        delete this.panels[panelExt.path];
    },

    init : function(amlNode){
        var _self = this;
        
        this.nodes.push(
            this.group = apf.document.body.appendChild(new apf.group({
                value : "[{req"+"uire('ext/settings/settings').model}::auto/panels/@active]"
            })),
            
            barMenu.appendChild(new apf.button({
                submenu : "mnuWindows",
                caption : "Windows",
                skin    : "c9-menu-btn",
                margin  : "1 0 0 0"
            })),
            mnuWindows
        );
        
        colLeft.addEventListener("resize", function(){
            if (_self.currentPanel)
                settings.model.setQueryValue("auto/panels/panel[@path='" 
                    + _self.currentPanel.path + "']/@width", colLeft.getWidth());
        });
        
        /**** Support for state preservation ****/
        
        var _self = this;
        this.$settings = {};
        ide.addEventListener("loadsettings", function(e){
            var strSettings = e.model.queryValue("auto/panel");
            if (strSettings) {
                try {
                    var obj = JSON.parse(strSettings);
                }
                catch (ex) {}
            }
        });

        var props = ["visible", "flex", "width", "height", "state"];
        ide.addEventListener("savesettings", function(e){
            var changed = false, 
                xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/panel/text()");

            var set, pset, path, parent, panel, p, i, l = props.length;
            for (path in _self.panels) {
                panel = _self.panels[path].panel;
                if (!panel) continue;

                if (!_self.$settings[path]) {
                    _self.$settings[path] = {parent: {}};
                    changed = true;
                }
                
                parent = panel.parentNode;
                set    = _self.$settings[path];
                pset   = _self.$settings[path].parent;

                for (i = 0; i < l; i++) {
                    if (props[i] == "width") {
                        if (set[p = props[i]] !== _self.panels[path].$lastWidth) {
                            set[p] = _self.panels[path].$lastWidth;
                            changed = true;
                        }
                        continue;
                    }
                        
                    if (set[p = props[i]] !== panel[p]) {
                        set[p] = panel[p];
                        changed = true;
                    }
                    if (pset[p] !== parent[p]) {
                        pset[p] = parent[p];
                        changed = true;
                    }
                }
            }
            
            if (changed) {
                xmlSettings.nodeValue = apf.serialize(_self.$settings);
                return true;
            }
        });
    },
    
    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },
    
    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },
    
    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
