module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("keybindings", __dirname);
    register(null, {
        "ext.keybindings": {}
    })
};