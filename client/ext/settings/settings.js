/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {
 
var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var fs = require("ext/filesystem/filesystem");
var markup = require("text!ext/settings/settings.xml");
var template = require("text!ext/settings/template.xml");
var panels = require("ext/panels/panels");
var skin = require("text!ext/settings/skin.xml");

return ext.register("ext/settings/settings", {
    name    : "Settings",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    skin    : skin,
    commands : {
        "showsettings": {hint: "open the settings window"}
    },
    hotitems: {},

    nodes : [],

    save : function(){
        var _self = this;
        clearTimeout(this.$customSaveTimer);

        this.$customSaveTimer = setTimeout(function(){
            ide.dispatchEvent("savesettings", {model : _self.model});
            _self.saveToFile();
        }, 100);
    },

    saveToFile : function(){
        ide.socket.send(JSON.stringify({
            command: "settings",
            action: "set",
            settings: this.model.data && apf.xmldb.cleanXml(this.model.data.xml) || ""
        }));
    },

    saveSettingsPanel: function() {
        var pages   = self.pgSettings ? pgSettings.getPages() : [],
            i       = 0,
            l       = pages.length,
            changed = false;
        for (; i < l; ++i) {
            if (!pages[i].$at) continue;
            if (pages[i].$at.undolength > 0) {
                pages[i].$commit(pages[i]);
                changed = true;
            }
        }
        if (ide.dispatchEvent("savesettings", {
            model : this.model
        }) !== false || changed)
            this.saveToFile();
    },

    addSection : function(tagName, name, xpath, cbCommit){
        var node = this.model.queryNode(xpath + "/" + tagName);
        if (!node)
            this.model.appendXml('<' + tagName + ' name="' + name +'" />', xpath);
    },

    load : function(){
        var _self = this;
        
        //@todo this should actually be an identifier to know that it was rights that prevented loading it
        ide.settings = ide.settings == "defaults" ? template : ide.settings;
        
        if (!ide.settings){
            ide.addEventListener("socketMessage", function(e){
                if (e.message.type == "settings") {
                    var settings = e.message.settings;
                    if (!settings || settings == "defaults")
                        settings = template;
                    ide.settings =  settings;
                    _self.load();
                    
                    ide.removeEventListener("socketMessage", arguments.callee);
                }
            });
            
            if (ide.onLine !== true) {
                ide.addEventListener("socketConnect", function(){
                    ide.socket.send(JSON.stringify({command: "settings", action: "get"}));
                });
            }
            else 
                ide.socket.send(JSON.stringify({command: "settings", action: "get"}));
            return;
        }
        
        this.model.load(ide.settings);

        ide.dispatchEvent("loadsettings", {
            model : _self.model
        });

        var checkSave = function() {
            if (ide.dispatchEvent("savesettings", {
                model : _self.model
            }) === true)
                _self.saveToFile();
        };
        this.$timer = setInterval(checkSave, 60000);

        apf.addEventListener("exit", checkSave);

        ide.addEventListener("$event.loadsettings", function(callback) {
            callback({model: _self.model});
        });
        
        ide.removeEventListener("afteronline", this.$handleOnline);
    },
    
    hook : function(){
        panels.register(this);
        
        this.nodes.push(navbar.insertBefore(new apf.radiobutton({
            skin    : "menu-radiobutton",
            value   : "preferences",
            group   : "acg1",
            "class" : "preferences",
            label   : "Preferences"
        }), navbar.firstChild));
        
        var _self = this;
        acg1.addEventListener("afterchange", function(e){
            if (e.value == "preferences") {
                panels.initPanel(_self);
                _self.enable();
            }
            else
                _self.disable();
        });
        
        this.hotitems["showsettings"] = [this.nodes[0]];

        this.model = new apf.model();

        ide.addEventListener("afteronline", this.$handleOnline = function(){
            _self.load();
        });
    },

    init : function(amlNode){
        /*this.btnOK = winSettings.selectSingleNode("a:vbox/a:hbox[2]/a:button[1]");
        this.btnOK.onclick = this.saveSettings.bind(this);
        this.btnCancel = winSettings.selectSingleNode("a:vbox/a:hbox[2]/a:button[2]");
        this.btnCancel.onclick = this.cancelSettings;
        this.btnApply = winSettings.selectSingleNode("a:vbox/a:hbox[2]/a:button[3]");
        this.btnApply.onclick = this.applySettings.bind(this);*/
        
        this.panel = winSettings;
        
        winSettings.addEventListener("hide", function(){
            colLeft.$ext.style.minWidth = "0px"; //hack
        });
        
        winSettings.addEventListener("show", function() {
            colLeft.$ext.style.minWidth = "215px"; //hack
        });
        
        colLeft.appendChild(winSettings);
    },

    showsettings: function() {
        ext.initExtension(this);
        winSettings.show();
        return false;
    },

    saveSettings: function() {
        winSettings.hide();
        this.saveSettingsPanel();
    },

    applySettings: function() {
        this.saveSettingsPanel();
    },

    cancelSettings: function() {
        winSettings.hide();
        var pages = pgSettings.getPages(),
            i     = 0,
            l     = pages.length;
        for (; i < l; ++i) {
            if (!pages[i].$at) continue;
            pages[i].$at.undo(-1);
        }
    },

    enable : function(){
        winSettings.show();
    },

    disable : function(){
        if (self.winSettings)
            winSettings.hide();
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