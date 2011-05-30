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

return ext.register("ext/dockpanel/dockpanel", {
    name           : "Dock Panel",
    dev            : "Ajax.org",
    alone          : true,
    type           : ext.GENERAL,

    defaultState   : {
        bars : []
    },

    nodes          : [],
    dockObjects    : [],
    
    /**
     * Standard Extension functionality
     */
    init : function(amlNode){
        var _self = this;
        
        this.layout = new DockableLayout(hboxMain, 
          //Find Page
          function(strExtension){
              
          }, 
          //Store Page
          function(amlPage){
              
          },
          //Change State Handler
          function(){
              _self.changed = true;
              settings.save();
          });
        
        ide.addEventListener("loadsettings", function(e){
            var model = e.model;
            var strSettings = model.queryValue("auto/dockpanel");
            _self.layout.loadState(strSettings
                ? apf.unserialize(strSettings)
                : _self.defaultState);
        });

        ide.addEventListener("savesettings", function(e){
            if (!_self.changed)
                return;

            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/dockpanel/text()");
            xmlSettings.nodeValue = apf.serialize(_self.layout.getState());
            
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
    
    addDockable : function(def){
        var state = this.defaultState;
        if (def.sections) {
            state.bars.push(def);
            return;
        }
        
        if (!state.bars[0])
            state.bars[0] = {expanded: false, width: 200, sections: []};

        var bar = state.bars[0];
        if (def.buttons)
            bar.sections.push(def);
        else
            bar.sections.push({
                flex    : 2,
                width   : 260,
                height  : 350,
                buttons : [def]
            });
    }, //properties.forceShow ??
    
    //@todo removal of pages
    
    /**
     * Increases the notification number count by one
     * 
     * @windowIdent identifier of the dock object
     */
    increaseNotificationCount: function(windowIdent){
        for(var doi = 0; doi < this.dockObjects.length; doi++) {
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
        
        return false;
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