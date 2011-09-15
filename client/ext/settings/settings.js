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

module.exports = ext.register("ext/settings/settings", {
    name    : "Preferences",
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

        if (!ide.settings) {
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
            
            if (ide.onLine === true)
                ide.socket.send(JSON.stringify({command: "settings", action: "get"}));
            return;
        }

        try {
            this.model.load(ide.settings);
        } catch(e) {
            this.model.load(template);
        }

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

        var btn = this.button = navbar.insertBefore(new apf.button({
            skin    : "mnubtn",
            state   : true,
            "class" : "preferences",
            caption : "Preferences"
        }), navbar.firstChild);

        var _self = this;

        btn.addEventListener("mousedown", function(e){
            var value = this.value;
            if (navbar.current && (navbar.current != _self || value)) {
                navbar.current.disable(navbar.current == _self);
                if (value)
                    return;
            }

            panels.initPanel(_self);
            _self.enable(true);
        });

        this.model = new apf.model();

        ide.addEventListener("afteronline", this.$handleOnline = function(){
            _self.load();
        });
    },

    init : function(amlNode){
        this.panel = winSettings;

        /*winSettings.addEventListener("hide", function(){
            colLeft.$ext.style.minWidth = "0px"; //hack
        });

        winSettings.addEventListener("show", function() {
            colLeft.$ext.style.minWidth = "215px"; //hack
        });*/

        colLeft.appendChild(winSettings);
    },

    showsettings: function(e){
        panels.initPanel(this);
        this.enable();
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

    enable : function(noButton){
        winSettings.show();
        colLeft.show();
        if (!noButton) {
            this.button.setValue(true);
            if(navbar.current && (navbar.current != this))
                navbar.current.disable(false);
        }
        splitterPanelLeft.show();
        navbar.current = this;
    },

    disable : function(noButton){
        if (self.winSettings)
            winSettings.hide();
        if (!noButton)
            this.button.setValue(false);

        splitterPanelLeft.hide();
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
