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
var packed = false;
var packedName = "";
for (var p = 2; p < process.argv.length; p++) {
    if (process.argv[p] == "-d") {
        debug = true;
    }

    else if (process.argv[p] == "-P") {
        packed = true;
        if (process.argv[p + 1].indexOf("-") < 0) // use this specific packed file
            packedName = process.argv[++p];
    }
}

var configPath = path.resolve(__dirname, "./configs/", configName);
var config = require(configPath);

config.containers.master.plugins.forEach(function(plugin) {
    if (plugin.packagePath && /\/cloud9.core$/.test(plugin.packagePath)) {
        plugin.debug = debug;
        plugin.packed = packed;
        plugin.packedName = packedName;
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
