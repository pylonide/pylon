"use strict";

module.exports = function startup(options, imports, register) {
    for (var name in options.plugins) {
        imports.static.addStatics([{
            path: options.plugins[name],
            mount: "/ext/" + name
        }]);
    }
    
    register(null, {
        "client-plugins": {}
    });
};