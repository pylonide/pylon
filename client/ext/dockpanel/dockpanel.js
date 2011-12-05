/**
 * Dock Panel for the Cloud9 IDE client
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var DockableLayout = require("ext/dockpanel/libdock");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/dockpanel/dockpanel", {
    name           : "Dock Panel",
    dev            : "Ajax.org",
    alone          : true,
    type           : ext.GENERAL,

    defaultState   : {
        bars : []
    },

    nodes          : [],
    dockpanels     : [],
    
    loaded : false,
    
    /**
     * Standard Extension functionality
     */
    init : function(amlNode){
        var _self = this;

        var vManager = new apf.visibilitymanager();
        this.layout = new DockableLayout(hboxDockPanel, 
            //Find Page
            function(arrExtension){
                if (!arrExtension || !_self.dockpanels[arrExtension[0]])
                    return false;

                var item = _self.dockpanels[arrExtension[0]][arrExtension[1]];
                if (item.page)
                    return item.page;

                var page = item.getPage();
                
                if (page)
                    page.$arrExtension = arrExtension;
                
                vManager.permanent(page, function(e){
                    item.mnuItem.check();
                }, function(){
                    item.mnuItem.uncheck();
                });

                return page;
            }, 
            //Store Page
            function(amlPage){
                var arrExtension = amlPage.$arrExtension;
                var item = _self.dockpanels[arrExtension[0]][arrExtension[1]];
                
                item.page = amlPage;
                item.mnuItem.uncheck();

                _self.saveSettings();
            },
            //@todo This can be deprecated
            //Find Button Options
            function(arrExtension){
                if (!arrExtension || !_self.dockpanels[arrExtension[0]])
                    return false;

                return _self.dockpanels[arrExtension[0]][arrExtension[1]].options;
            },
            //Change State Handler
            function(){
                _self.saveSettings();
            }
        );

        //@todo was loadsettings
        ide.addEventListener("extload", function(e){
            var model = settings.model;
            var strSettings = model.queryValue("auto/dockpanel/text()");

            var state = _self.defaultState;
            if (strSettings) {
                // JSON parse COULD fail
                try {
                    state = JSON.parse(strSettings);
                }
                catch (ex) {}
            }
            
            _self.layout.loadState(state);
            _self.loaded = true;
        });

        mnuToolbar.appendChild(new apf.item({
            caption : "Restore Default",
            onclick : function(){
                var defaultSettings = _self.defaultState,//settings.model.queryValue("auto/dockpanel_default/text()"),
                    state;
                    
                if (defaultSettings) {
                    // JSON parse COULD fail
                    try {
                        state = defaultSettings;//objSettings.state;
                    }
                    catch (ex) {}
                    _self.layout.loadState(state);
                    
                    settings.model.setQueryValue("auto/dockpanel/text()", state)
                    
                    _self.saveSettings();
                    
                    ide.dispatchEvent("restorelayout");
                }
            }
        }));
        
        mnuToolbar.appendChild(new apf.divider());
    },
    
    saveSettings : function(){
        clearTimeout(this.$timer);
        
        var _self = this;;
        this.$timer = setTimeout(function(){
            settings.model.setQueryValue(
                "auto/dockpanel/text()",
                JSON.stringify(_self.layout.getState(true))
            );
        });
    },

    enable : function(){
        if (this.$lastState)
            this.layout.loadState(this.$lastState);
    },

    disable : function(){
        this.$lastState = this.layout.getState();
        this.layout.clearState();
    },

    destroy : function(){
        this.layout.clearState();
    },

    register : function(name, type, options, getPage){
        var panel = this.dockpanels[name] || (this.dockpanels[name] = {});
        panel[type] = {
            options : options,
            getPage : getPage
        };

        var layout = this.layout, _self = this;

        panel[type].mnuItem = mnuToolbar.appendChild(new apf.item({
            caption : options.menu.split("/").pop(),
            id      : "mnu" + type,
            type    : "check",
            onclick : function(){
                var page = getPage();

                var uId = _self.$findButtons(name, type)[0].uniqueId;
                layout.show(uId);
                if (!layout.isExpanded(uId))
                    layout.showMenu(uId);
                
                page.parentNode.set(page);
            }
        }));        
    },

    addDockable : function(def){        
        var state = this.defaultState;
            
        if (!def.barNum)
            def.barNum = 0;
        
        if (def.sections) {
            if (def.barNum || def.barNum === 0) {
                if (state.bars[def.barNum])
                    state.bars[def.barNum].sections.merge(def.sections);
                else
                    state.bars[def.barNum] = def;
            }
            else
                state.bars.push(def);
            
            return;
        }

        if (!state.bars[def.barNum || 0])
            state.bars[def.barNum || 0] = {expanded: false, width: 230, sections: []};

        var bar = state.bars[def.barNum || 0];
        
        if (def.buttons) {
            bar.sections.push(def);
        }
        else {
            bar.sections.push({
                flex    : 2,
                width   : 260,
                height  : 350,
                buttons : [def]
            });
        }
        
        return bar.sections.slice(-1);
    }, //properties.forceShow ??
    
    $findButtons : function(name, type){
        var state = this.layout.getState();
        var list  = [];
        
        state.bars.each(function(bar){
            bar.sections.each(function(section){
                section.buttons.each(function(button){
                    if ((!name || button.ext[0] == name)
                      && (!type || button.ext[1] == type))
                        list.push(button);
                });
            });
        });
        
        return list;
    },
    
    hideSection: function(name){
        var buttons = this.$findButtons(name);
        var _self = this;
        
        buttons.each(function(button){
            if (!button.hidden)
                _self.layout.hide(button.uniqueId);
        });
    },
    
    showSection: function(name){
        var buttons = this.$findButtons(name);
        var _self = this;
        var bars = [];
        
        buttons.each(function(button){
            if (button.hidden && button.hidden != 2) {
                _self.layout.show(button.uniqueId);
                bars.pushUnique(_self.layout.findBar((button.uniqueId)));
            }
        });
        
        bars.each(function(bar){
            _self.layout.expandBar(bar);
            apf.getArrayFromNodelist(bar.vbox.selectNodes("tab")).each(function(tab){
                tab.set(tab.getPage(0));
            });
        });
    },
    
    //@todo removal of pages
    
    /**
     * Increases the notification number count by one
     * 
     * @windowIdent identifier of the dock object
     */
    increaseNotificationCount: function(windowIdent){
        /*for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if (this.dockObjects[doi].ident == windowIdent) {
                // Only increase notification count if window is hidden
                if (this.dockObjects[doi].btn.value == false) {
                    if (this.dockObjects[doi].notCount >= 99)
                        return true;

                    this.dockObjects[doi].notCount++;
                    this.updateNotificationElement(
                            this.dockObjects[doi].btn
                            , this.dockObjects[doi].notCount
                    );
                }
                
                return true;
            }
        }
        
        return false;*/
    },

    /**
     * Resets the notification count to 0
     */
    resetNotificationCount: function(windowIdent){
        if (windowIdent == -1) return;

        for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if (this.dockObjects[doi].ident == windowIdent) {
                this.dockObjects[doi].notCount = 0;
                this.updateNotificationElement(this.dockObjects[doi].btn, 0);
                return true;
            }
        }
        
        return false;
    },
    
    /**
     * Updates the notification element to visually reflect notCount
     */
    updateNotificationElement: function(btnObj, count){
        if (count == 0) {
            var countInner = "";
        }
        
        else {
            var countInner = count;
        }

        if (apf.isGecko) {
            btnObj.$ext.getElementsByClassName("dock_notification")[0].textContent = countInner;
        }
            
        else {
            btnObj.$ext.getElementsByClassName("dock_notification")[0].innerText = countInner;
        }
        
        return true;
    }
});

    }
);
