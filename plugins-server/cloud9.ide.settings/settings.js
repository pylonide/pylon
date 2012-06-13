/**
 * Settings Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var Plugin = require("../cloud9.core/plugin");
var fsnode = require("vfs-nodefs-adapter");
var util = require("util");
var assert = require("assert");

var name = "settings";

var SETTINGS_PATH;
var VFS;

module.exports = function setup(options, imports, register) {
    assert(options.settingsPath, "option 'settingsPath' is required");
    SETTINGS_PATH = options.settingsPath;
    VFS = imports.vfs;
    imports.ide.register(name, SettingsPlugin, register);
};

var SettingsPlugin = module.exports.SettingsPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["command"];
    this.name = name;
    this.fs = fsnode(VFS);
    this.settingsPath = SETTINGS_PATH;
};

util.inherits(SettingsPlugin, Plugin);

(function() {
    this.counter = 0;

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
        var self = this;
        this.fs.exists(this.settingsPath, function(exists) {
            if (exists) {
                self.fs.readFile(self.settingsPath, "utf8", callback);
            }
            else {
                callback("settings file does not exist", "");
            }
        });
    };

    this.storeSettings = function(user, settings, callback) {
        var self = this;
        // console.log("store settings", this.settingsPath);
        // Atomic write (write to tmp file and rename) so we don't get corrupted reads if at same time.
        var tmpPath = self.settingsPath + "~" + new Date().getTime() + "-" + ++this.counter;
        this.fs.writeFile(tmpPath, settings, "utf8", function(err) {
            if (err) {
                callback(err);
                return;
            }
            self.fs.rename(tmpPath, self.settingsPath, callback);
        });
    };

}).call(SettingsPlugin.prototype);