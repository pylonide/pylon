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
    sections       : [],
    
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
                page.$arrExtension = arrExtension;

                /*vManager.permanent(page, function(e){
                    item.mnuItem.check();
                }, function(){
                    item.mnuItem.uncheck();
                });*/

                return page;
            }, 
            //Store Page
            function(amlPage){
                var arrExtension = amlPage.$arrExtension;
                var item = _self.dockpanels[arrExtension[0]][arrExtension[1]];
                item.page = amlPage;

                _self.sections[arrExtension[0]][arrExtension[1]] = {
                    buttons : [
                        { ext : [arrExtension[0], arrExtension[1]] }
                    ]
                };

                item.mnuItem.uncheck();

                _self.changed = true;
                settings.save();
            },
            //Find Button Options
            function(arrExtension){
                if (!arrExtension || !_self.dockpanels[arrExtension[0]])
                    return false;

                return _self.dockpanels[arrExtension[0]][arrExtension[1]].options;
            },
            //Change State Handler
            function(){
                _self.changed = true;
                settings.save();
            }
        );

        ide.addEventListener("loadsettings", function(e){
            var model = e.model;
            var strSettings = model.queryValue("auto/dockpanel");
            
            var settings = _self.defaultState;
            if (strSettings) {
                // JSON parse COULD fail
                try {
                    var objSettings = JSON.parse(strSettings);
                    settings = objSettings.state;
                    apf.extend(_self.sections, objSettings.hidden);
                }
                catch (ex) {}
            }
            
            _self.layout.loadState(_self.defaultState);
            _self.loaded = true;
        });

        ide.addEventListener("savesettings", function(e){
            if (!_self.changed)
                return;

            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/dockpanel/text()");
            xmlSettings.nodeValue = apf.serialize({
                state  : _self.layout.getState(),
                hidden : _self.sections
            });
            
            return true;
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

        panel[type].mnuItem = mnuWindows.appendChild(new apf.item({
            caption : options.menu.split("/").pop(),
            type    : "check",
            onclick : function(){
                var page = getPage();

                //Problem state might not be removed from 
                if (!page.parentNode || !page.parentNode.dock) {
                    layout.addItem(_self.sections[name][type]);
                    layout.show(page);
                }
                else {
                    layout.show(page);
                }
            }
        }));
        
        
    },

    addDockable : function(def){
        if (this.loaded) {
            this.layout.addItem(def);
            return;
        }
        
        var state = this.defaultState;
        if (def.sections) {
            state.bars.push(def);
            return;
        }
        
        if (def.hidden) {
            var buttons = def.buttons;
            for (var i = 0; i < buttons.length; i++) {
                var ext = buttons[i].ext;
                (this.sections[ext[0]] || (this.sections[ext[0]] = {}))[ext[1]] = def;
            }
            return;
        }

        if (!state.bars[0])
            state.bars[0] = {expanded: false, width: 200, sections: []};

        var bar = state.bars[0];
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
    
    //@todo removal of pages
    
    /**
     * Increases the notification number count by one
     * 
     * @windowIdent identifier of the dock object
     */
    increaseNotificationCount: function(windowIdent){
        /*for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if(this.dockObjects[doi].ident == windowIdent) {
                // Only increase notification count if window is hidden
                if(this.dockObjects[doi].btn.value == false) {
                    if(this.dockObjects[doi].notCount >= 99)
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
        if(windowIdent == -1) return;

        for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if(this.dockObjects[doi].ident == windowIdent) {
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
        if(count == 0) {
            var countInner = "";
        }
        
        else {
            var countInner = count;
        }

        if(apf.isGecko) {
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
