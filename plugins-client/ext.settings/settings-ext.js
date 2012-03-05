module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("settings", __dirname + "/settings");

    register(null, {
        "client.ext.settings": {}
    });
};