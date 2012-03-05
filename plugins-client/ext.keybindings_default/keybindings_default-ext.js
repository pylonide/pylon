module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("keybindings_default", __dirname);
    register(null, {
        "ext.keybindings_default": {}
    })
};