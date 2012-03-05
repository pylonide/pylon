module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("recentfiles", __dirname + "/recentfiles");

    register(null, {
        "client.ext.recentfiles": {}
    });
};