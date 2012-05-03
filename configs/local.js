
var config = require("./default");

config.containers.master.plugins.forEach(function(plugin) {
    if (plugin.packagePath) {
        if (/\/cloud9.core$/.test(plugin.packagePath)) {
            plugin.contexts = {
                "location": {
                    "local": true
                }
            };
        }
    }
});

module.exports = config;
