var IdeServer = require("./ide");

module.exports = function setup(options, imports, register) {

    var log = imports.log;
    var hub = imports.hub;

    var plugins = {};

    register(null, {
        ide: {
            register: function(name, plugin, callback) {
                plugins[name] = plugin;
                callback();
            }
        }
    });

    hub.on("containersDone", function() {

        var server = imports.http.getServer();

        var ideOptions = {
            workspaceDir: options.workspaceDir || __dirname + "/../../"
        };

        var ide = new IdeServer(ideOptions, server, plugins);

        log.info("IDE server initialized");
    });
};