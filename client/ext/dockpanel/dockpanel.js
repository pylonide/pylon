/**
 * Dock Panel for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/dockpanel/dockpanel.xml");

return ext.register("ext/dockpanel/dockpanel", {
    name   : "Dock Panel Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,
    
    nodes : [],
    panels : {},
    
    showingAll : true,
    
    initPanel : function(panelExt){
        if (panelExt.panel)
            return;
        
        ext.initExtension(panelExt);
        
        /*var set = this.$settings && this.$settings[panelExt.path];
        if (set)
            this.setPanelSettings(panelExt, set);
        */

        //panelExt.panel.setAttribute("draggable", "false");
    },
    
    togglePanel : function(panelExt, btnObj) {
        var btnClasses = btnObj.getAttribute("class").split(" ");

        if(btnClasses.length > 1) {
            panelExt.panel.hide();
            panelExt.disable();
            btnObj.setAttribute("class", btnClasses[0]);
        }
        
        else {
            // Hide other panels
            /****
             * IMPORTANT: This code assumes only one panel can be open at a
             * time, at all, for the right side dock. Modify if more than
             * one panel is permitted to be open at once
             *****/
            for(p in this.panels) {
                if(this.panels[p].ext.panel && this.panels[p].ext.panel.visible) {
                    this.panels[p].ext.panel.hide();
                    this.panels[p].btn.setAttribute(
                            "class",
                            this.panels[p].ext.buttonClassName
                        );
                    break;
                }
            }
            
            panelExt.panel.setTop(apf.getAbsolutePosition(btnObj.$ext)[1]);
            panelExt.panel.show();
            btnObj.setAttribute("class", btnClasses[0] + " button-debugChecked");
        }
    },
    
    /**
     * Registers a basic chat window
     * This is as opposed to a regular registration -- this simply keeps track of
     * a button and window connection
     * 
     **/
    registerWindow : function(){
        
    },
    
    unregisterWindow : function(){
        
    },
    
    register : function(panelExt, btn_position){
        var _self = this;
        /*panelExt.mnuItem = mnuPanels.appendChild(new apf.item({
            caption : panelExt.name,
            type    : "check",
            checked : panelExt.visible || false,
            onclick : function(){
                _self.initPanel(panelExt);
                this.checked ? panelExt.enable() : panelExt.disable();
            }
        }));*/

        //<a:button skin="button-debug" class="contact_list" state="true" />
        btnTemp = new apf.button({
            skin: "button-debug",
            'class': panelExt.buttonClassName,
            state: "true",
            onclick: function() {
                _self.initPanel(panelExt);
                panelExt.enable();
                _self.togglePanel(panelExt, this);
            }
        });
    
        var appendedDockBtn = dockPanelRight.insertBefore(btnTemp, dockPanelRight.childNodes[1]);
        if(typeof btn_position === 'undefined') {
            var appendedDockBtn = dockPanelRight.insertBefore(btnTemp, dockRightDivider);
        }
        
        else {
            var appendedDockBtn = dockPanelRight.insertBefore(btnTemp, dockPanelRight.childNodes[btn_position]);   
        }
    
        this.nodes.push(appendedDockBtn);

        /*if (this.$settings && this.$settings[panelExt.path]) {
            this.setPanelSettings(panelExt, _self.$settings[panelExt.path]);
        }
        else*/
        
        if (panelExt.visible) {
            if (panelExt.skin) {
                setTimeout(function(){
                    this.initPanel(panelExt);
                });
            }
            else {
                this.initPanel(panelExt);
            }
        }
        
        // Set the position of the extension window associated with new button
        //panelExt.panel.setTop(apf.getAbsolutePosition(btnObj.$ext)[1]);

        //this.panels[panelExt.path] = { ext : panelExt, btn : appendedDockBtn };
    },
    
    unregister : function(panelExt){
        delete this.panels[panelExt.path];
    },

    /**** TODO Support for state preservation ****/
    /*setPanelSettings : function(panelExt, set){
        if (!panelExt.panel) {
            if (set.visible)
                this.initPanel(panelExt);
            return;
        }
        
        var pset, panel = panelExt.panel, parent = panel.parentNode;
        for (var prop in set) {
            if (prop == "parent") {
                if (panelExt.excludeParent)
                    continue;
                
                pset = set.parent;
                for (prop in pset) {
                    if (parent[prop] != pset[prop])
                        parent.setAttribute(prop, pset[prop]);
                }
            }
            else {
                if (panel[prop] != set[prop]) {
                    if (prop == "visible")
                        panel[set[prop] ? "enable" : "disable"]();
                    if (prop == "height" || !panelExt.excludeParent)
                        panel.setAttribute(prop, set[prop]);
                }
            }
        }
    },*/
    
    init : function(amlNode){
        /**** TODO Add Menu Item
         * 
        ****/
        var _self = this;
        
        /**** Support for state preservation ****/
        
        /*this.$settings = {};
        ide.addEventListener("loadsettings", function(e){
            var strSettings = e.model.queryValue("auto/panel");
            if (strSettings) {
                _self.$settings = apf.unserialize(strSettings);
                
                var panelExt;
                for (var path in _self.$settings) {
                    if ((panelExt = _self.panels[path]) && panelExt.panel)
                        _self.setPanelSettings(panelExt, _self.$settings[path]);
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
        });*/
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
