#!/usr/bin/env node

var path = require('path');
var architect = require("architect");

var configName = process.argv[2] || "default";

// when command line arguments are passed into this, we ignore them
// when loading the config file.
/*if (configName.indexOf("-") === 0) {
    configName = "default";
}*/

configName = "packed";

var configPath = path.resolve(__dirname, "./configs/", configName);

architect.createApp(configPath, function (err, app) {
    if (err) {
        console.error("While starting the '%s':", configPath);
        throw err;
    }
    console.log("Started '%s'!", configPath);
});