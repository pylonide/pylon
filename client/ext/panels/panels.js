/**
 * Extension Manager for the Ajax.org Cloud IDE
 */
require.def("ext/panels/panels",
    ["core/ide", "core/ext", "ext/settings/settings", "text!ext/panels/panels.xml"],
    function(ide, ext, settings, markup) {
        
return ext.register("ext/panels/panels", {
    name   : "Panel Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    markup : markup,
    
    nodes : [],
    panels : {},
    
    initPanel : function(panelExt){
        ext.initExtension(panelExt);
        this.$setEvents(panelExt);
    },
    
    register : function(panelExt){
        var _self = this;
        panelExt.mnuItem = mnuPanels.appendChild(new apf.item({
            caption : panelExt.name,
            type    : "check",
            checked : panelExt.visible || false,
            onclick : function(){
                _self.initPanel(panelExt);
                this.checked ? panelExt.enable() : panelExt.disable();
            }
        }));
        
        if (panelExt.visible)
            _self.initPanel(panelExt);
        
        this.panels[panelExt.path] = panelExt;
    },
    
    $setEvents : function(panelExt){
        panelExt.panel.addEventListener("show", function(){
            if (!this.parentNode.visible)
                this.parentNode.show();
            panelExt.mnuItem.check();
        });
        panelExt.panel.addEventListener("hide", function(){
            panelExt.mnuItem.uncheck();
            if (!this.parentNode.selectSingleNode("node()[not(@visible='false')]"))
                this.parentNode.hide();
        });
        //panelExt.panel.show();
        
        this.setPanelSettings(panelExt, this.$settings[panelExt.path]);
    },
    
    unregister : function(panelExt){
        panelExt.mnuItem.destroy(true, true);
        delete this.panels[panelExt.path];
    },
    
    setPanelSettings : function(panelExt, set){
        var pset, panel = panelExt.panel, parent = panel.parentNode;
        for (prop in set) {
            if (prop == "parent") {
                pset = set.parent;
                for (prop in pset) {
                    if (parent[prop] != pset[prop])
                        parent.setAttribute(prop, pset[prop]);
                }
            }
            else {
                if (panel[prop] != set[prop])
                    panel.setAttribute(prop, set[prop]);
            }
        }
    },
    
    init : function(amlNode){
        this.nodes.push(
            barMenu.appendChild(new apf.button({
                submenu : "mnuPanels",
                caption : "Windows"
            })),
            mnuPanels
        );
        
        /**** Support for state preservation ****/
        
        var _self = this;
        this.$settings = {};
        ide.addEventListener("loadsettings", function(e){
            var strSettings = e.model.queryValue("auto/panel");
            if (strSettings) {
                _self.$settings = apf.unserialize(strSettings);
                
                var panel;
                for (var path in _self.$settings) {
                    if (_self.panels[path] && (panel = _self.panels[path].panel))
                        _self.setPanelSettings(panel, _self.$settings[path]);
                }
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

    }
);