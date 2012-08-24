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

var FS;
var SETTINGS_PATH;

var trimFilePrefix;
var locationsToSwap = {"files" : "active", "file" : "path", "tree_selection": "path" };  
var propertiesToSwap= ["projecttree", "tabcycle", "recentfiles"];

module.exports = function setup(options, imports, register) {
    assert(options.settingsPath, "option 'settingsPath' is required");
    SETTINGS_PATH = options.settingsPath;

    imports.sandbox.getProjectDir(function(err, projectDir) {
        FS = fsnode(imports.vfs, projectDir);

        // If absolute settings path option is set we use that path and NodeJS's FS.
        // This is needed by c9local where settings file cannot be stored at `/.settings`.
        if (typeof options.absoluteSettingsPath !== "undefined") {
            FS = require("fs");
            if (typeof FS.exists !== "function") {
                FS.exists = require("path").exists;
            }
            SETTINGS_PATH = options.absoluteSettingsPath;        
        }

        trimFilePrefix = options.trimFilePrefix;
        imports.ide.register(name, SettingsPlugin, register);
    });
};

var SettingsPlugin = module.exports.SettingsPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["command"];
    this.name = name;
    this.fs = FS;
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
                self.fs.readFile(self.settingsPath, "utf8", function(err, settings) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    
                    // for local version, we need to pluck the paths in settings prepended with username + workspace id (short)
                    if (trimFilePrefix !== undefined) {
                        var attrSet = '="';
                        
                        for (var l in locationsToSwap) {
                            var attribute = locationsToSwap[l] + attrSet;
                            
                            settings = settings.replace(new RegExp(attribute + "/workspace", "g"), attribute + trimFilePrefix + "/workspace");
                        }
                        
                        propertiesToSwap.forEach(function (el, idx, arr) {
                            var openTagPos= settings.indexOf("<" + el);
                            var closeTagPos= settings.indexOf("</" + el + ">");
    
                            if (openTagPos > 0 && closeTagPos > 0) {
                                var originalPath = settings.substring(openTagPos, closeTagPos);
                                var newPath = originalPath.replace(new RegExp("/workspace", "g"), trimFilePrefix + "/workspace");

                                settings = settings.replace(originalPath, newPath);
                            }
                        });
                    }
                    
                    callback(err, settings);
                });
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
        
        // for local version, we need to rewrite the paths in settings to store as "/workspace"
        if (trimFilePrefix !== undefined) {
            var attrSet = '="';
            
            for (var l in locationsToSwap) {
                var attribute = locationsToSwap[l] + attrSet;
                
                settings = settings.replace(new RegExp(attribute + trimFilePrefix, "g"), attribute);
            }
            
            propertiesToSwap.forEach(function (el, idx, arr) {
                var openTagPos= settings.indexOf("<" + el);
                var closeTagPos= settings.indexOf("</" + el + ">");
                
                if (openTagPos > 0 && closeTagPos > 0) {
                    var originalPath = settings.substring(openTagPos, closeTagPos);
                    var newPath = originalPath.replace(new RegExp(trimFilePrefix, "g"), "");
                    settings = settings.replace(originalPath, newPath);
                }
            });
        }
                
        this.fs.writeFile(tmpPath, settings, "utf8", function(err) {
            if (err) {
                callback(err);
                return;
            }
            self.fs.rename(tmpPath, self.settingsPath, callback);
        });
    };

}).call(SettingsPlugin.prototype);