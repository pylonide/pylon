module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("keybindings_default", __dirname + "/keybindings_default");

    register(null, {
        "client.ext.keybindings_default": {}
    });
};