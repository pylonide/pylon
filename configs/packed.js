var plugins = require("./default");

/*
plugins.forEach(function(plugin) {
    if (plugin.packagePath) {
        if (/\/cloud9.core$/.test(plugin.packagePath)) {
        }
    }
});
*/

plugins = plugins.filter(function(plugin) {
   // returns false if any of these plugins are detected; lib.packed will emit them
   return !(/\/plugins-client\/cloud9.core$/.test(plugin) ||
            /\/plugins-client\/lib.ace$/.test(plugin) ||
            /\/plugins-client\/lib.apf$/.test(plugin) ||
            /\/plugins-client\/lib.treehugger$/.test(plugin) ||
            /\/plugins-client\/lib.v8debug$/.test(plugin))
});

plugins.push("./../plugins-client/lib.packed");

module.exports = plugins;