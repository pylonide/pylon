/**
 * Extension manager for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {
    
var ide = require("core/ide");
var template = "<settings />";

module.exports = {
    model : new apf.model(),
    
    save : function(){
        if (!ide.inited)
            return;
        
        var _self = this;
        clearTimeout(this.$customSaveTimer);

        this.$customSaveTimer = setTimeout(function(){
            ide.dispatchEvent("savesettings", {model : _self.model});
            _self.saveToFile();
        }, 100);
    },
    
    saveToFile : function() {
        if (ide.onLine) {
            ide.send(JSON.stringify({
                command: "settings",
                action: "set",
                settings: this.model.data && apf.xmldb.cleanXml(this.model.data.xml) || ""
            }));
        }
        else if (this.model.data) {
            localStorage[this.sIdent] = apf.xmldb.cleanXml(this.model.data.xml) || "";
        }
    },
    
    load : function(xml){
        try {
            this.model.load(xml);
        } catch(e) {
            this.model.load(template);
        }

        if (window.onerror) {
            try {
                ide.dispatchEvent("loadsettings", {
                    model : this.model
                });
            } catch(e) {
                self["requ"+"ire"]("ext/filesystem/filesystem")    
                  .saveFile("/workspace/.c9.brokensettings.xml", xml.xml || xml);
                
                this.model.load(template);
                
                ide.dispatchEvent("loadsettings", {
                    model : this.model
                });
            }
        }
        else {
            ide.dispatchEvent("loadsettings", {
                model : this.model
            });
        }
        
        ide.addEventListener("$event.loadsettings", this.$loadsettings);
        
        this.loaded = true;
    },
    
    $loadsettings : function(cb){
        cb({model : require('core/settings').model});
    },
    
    /**
     * Initializes the settings. The settings can come from different sources:
     * - Template (used for when no settings have been stored previously)
     * - Parsed into the index file (by the backend - apf.IdeSettings)
     * - LocalStorage (saved for use when starting in offline mode only)
     */
    init : function(){
        var xml, _self = this;
        var resetSettings = location.href.indexOf('reset=1') > -1;
        var sIdent = this.sIdent = "cloud9.settings." + ide.workspaceId;
        
        if (resetSettings)
            xml = template;
            
        // Load from local storage
        else if (localStorage[sIdent])
            xml = localStorage[sIdent];

        // Load from template 
        else if (!apf.IdeSettings || apf.IdeSettings == "defaults")
            xml = template
        
        // Load from parsed settings in the index file
        else if (apf.IdeSettings)
            xml = apf.IdeSettings;
        
        if (!xml) {
            ide.addEventListener("socketMessage", function(e){
                if (e.message.type == "settings") {
                    var settings = e.message.settings;
                    if (!settings || settings == "defaults")
                        settings = template;
                    
                    _self.load(settings);

                    ide.removeEventListener("socketMessage", arguments.callee);
                }
            });
            
            if (ide.onLine === true)
                ide.send(JSON.stringify({command: "settings", action: "get"}));
            return;
        }

        this.load(xml);
        
        /**** Events ****/
        
        var checkSave = function() {
            if (ide.dispatchEvent("savesettings", {
                model : _self.model
            }) === true)
                _self.saveToFile();
        };
        this.$timer = setInterval(checkSave, 60000);

        apf.addEventListener("exit", checkSave);

        ide.addEventListener("afteronline", function(){
            _self.saveToFile(); //Save to file
            
            localStorage[sIdent] = null;
            delete localStorage[sIdent];
        });
        
        ide.addEventListener("afteroffline", function(){
            if (_self.loaded)
                _self.saveToFile(); //Save in local storage
        });
    }
};

module.exports.init();

});
