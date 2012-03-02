/**
 * Settings Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var Path = require("path");
var fs = require("fs");
var sys = require("sys");

var SettingsPlugin = module.exports = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["command"];
    this.name = "settings";
    
    this.settingsPath = ide.options.mountDir + "/.settings.xml";
};

sys.inherits(SettingsPlugin, Plugin);

(function() {
    
    this.command = function(user, message, client) {
        if (message.command != "settings")
            return false;
        
        var _self = this;
        if (message.action == "get") {
            this.loadSettings(user, function(err, settings) {
                client.send(JSON.stringify({
                    "type": "settings",
                    "settings": err || !settings ? "defaults" : settings
                }));
            });
        }
        else if (message.action == "set") {
            this.storeSettings(user, message.settings, function(err) {
                if (err)
                    _self.error(err, 500, message, client);
            });
        }
        return true;
    };
    
    this.loadSettings = function(user, callback) {
        // console.log("load settings", this.settingsPath);
        var _self = this;
        Path.exists(this.settingsPath, function(exists) {
            if (exists) {
                fs.readFile(_self.settingsPath, "utf8", callback);
            }
            else {
                callback("settings file does not exist", "");
            }
        });
    };
    
    this.storeSettings = function(user, settings, callback) {
        // console.log("store settings", this.settingsPath);
        fs.writeFile(this.settingsPath, settings, "utf8", callback);
    };
      
}).call(SettingsPlugin.prototype);