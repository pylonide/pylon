module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("settings", __dirname, register);

    register(null, {
        "ext.settings": {}
    })
};