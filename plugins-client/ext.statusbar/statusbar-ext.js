module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("statusbar", __dirname + "/statusbar");

    register(null, {
        "client.ext.statusbar": {}
    });
};