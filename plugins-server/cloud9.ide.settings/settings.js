/**
 * Settings Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

var fsnode = require("vfs-nodefs-adapter");
var assert = require("assert");
var Connect = require("connect");
var error = require("http-error");

var locationsToSwap = {"files" : "active", "file" : "path", "tree_selection": "path" };  
var propertiesToSwap= ["projecttree", "tabcycle", "recentfiles"];

module.exports = function setup(options, imports, register) {
    assert(options.settingsPath, "option 'settingsPath' is required");
    var settingsPath = options.settingsPath;

    imports.sandbox.getProjectDir(function(err, projectDir) {
        var fs = fsnode(imports.vfs, projectDir);

        // If absolute settings path option is set we use that path and NodeJS's FS.
        // This is needed by c9local where settings file cannot be stored at `/.settings`.
        if (typeof options.absoluteSettingsPath !== "undefined") {
            fs = require("fs");
            fs.exists = require("path").exists;
            settingsPath = options.absoluteSettingsPath;        
        }

        new SettingsPlugin(fs, settingsPath, options.trimFilePrefix).registerRoutes(imports["ide-routes"]);
        
        register();
    });
};

var SettingsPlugin = module.exports.SettingsPlugin = function(fs, settingsPath, trimFilePrefix) {
    this.fs = fs;
    this.settingsPath = settingsPath;
    this.trimFilePrefix = trimFilePrefix;
};

(function() {
    this.counter = 0;

    this.registerRoutes = function(connect) {
        var self = this;
        
        connect.use("/settings", function(req, res, next) {
            console.log("SETTINGS", req.url)
            if (req.method !== "GET" && req.method !== "POST")
                return next();
                
            if (req.method == "GET") {
                self.loadSettings(function(err, settings) {
                    if (err) return next(err);
                    
                    res.writeHead(200, {
                        "Content-Type": "application/json"
                    });
                    res.end(settings);
                });
            }
            else if (req.method == "POST") {
                //console.log(req.body);
                var settings = "";
                req.on("data", function(data) {
                    settings += data;
                })
                req.on("end", function() {
                    self.storeSettings(settings, function(err) {
                        res.writeHead(err ? 500 : 200);
                        res.end(err || "");
                    });
                });
            }
        });
    };

    this.loadSettings = function(callback) {
        console.log("load settings", this.settingsPath);
        var self = this;
        this.fs.exists(this.settingsPath, function(exists) {
            if (exists) {
                self.fs.readFile(self.settingsPath, "utf8", function(err, settings) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    
                    // for local version, we need to pluck the paths in settings prepended with username + workspace id (short)
                    if (self.trimFilePrefix !== undefined) {
                        var attrSet = '="';
                        
                        for (var l in locationsToSwap) {
                            var attribute = locationsToSwap[l] + attrSet;
                            
                            settings = settings.replace(new RegExp(attribute + "/workspace", "g"), attribute + self.trimFilePrefix + "/workspace");
                        }
                        
                        propertiesToSwap.forEach(function (el, idx, arr) {
                            var openTagPos= settings.indexOf("<" + el);
                            var closeTagPos= settings.indexOf("</" + el + ">");
    
                            if (openTagPos > 0 && closeTagPos > 0) {
                                var originalPath = settings.substring(openTagPos, closeTagPos);
                                var newPath = originalPath.replace(new RegExp("/workspace", "g"), self.trimFilePrefix + "/workspace");

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

    this.storeSettings = function(settings, callback) {
        var self = this;
        console.log("store settings", this.settingsPath);
        // Atomic write (write to tmp file and rename) so we don't get corrupted reads if at same time.
        var tmpPath = self.settingsPath + "~" + new Date().getTime() + "-" + ++this.counter;
        
        // for local version, we need to rewrite the paths in settings to store as "/workspace"
        if (self.trimFilePrefix !== undefined) {
            var attrSet = '="';
            
            for (var l in locationsToSwap) {
                var attribute = locationsToSwap[l] + attrSet;
                
                settings = settings.replace(new RegExp(attribute + self.trimFilePrefix, "g"), attribute);
            }
            
            propertiesToSwap.forEach(function (el, idx, arr) {
                var openTagPos= settings.indexOf("<" + el);
                var closeTagPos= settings.indexOf("</" + el + ">");
                
                if (openTagPos > 0 && closeTagPos > 0) {
                    var originalPath = settings.substring(openTagPos, closeTagPos);
                    var newPath = originalPath.replace(new RegExp(self.trimFilePrefix, "g"), "");
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