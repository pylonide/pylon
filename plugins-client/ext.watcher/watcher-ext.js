module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("watcher", __dirname + "/watcher");

    register(null, {
        "client.ext.watcher": {}
    });
};