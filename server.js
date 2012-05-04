#!/usr/bin/env node

var path = require('path');
var architect = require("architect");

// TODO: Need better args parser.

var configName = process.argv[2] || "default";
// when command line arguments are passed into this, we ignore them
// when loading the config file.
if (configName.indexOf("-") === 0) {
    configName = "default";
}
var debug = false;
if (process.argv.indexOf("-d") >= 0 ) {
    debug = true;
}

var configPath = path.resolve(__dirname, "./configs/", configName);
var config = require(configPath);

config.containers.master.plugins.forEach(function(plugin) {
    if (plugin.packagePath && /\/cloud9.core$/.test(plugin.packagePath)) {
        plugin.debug = debug;
    }
});

architect.createApp(config, {
    console: ((debug)?console:null)
}, function (err, app) {
    if (err) {
        console.error("While starting the '%s':", configPath);
        throw err;
    }
    console.log("Started '%s'!", configPath);
});
