module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("keybindings", __dirname + "/keybindings");

    register(null, {
        "client.ext.keybindings": {}
    });
};