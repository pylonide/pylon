module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("themes_default", __dirname);
    register(null, {
        "ext.themes_default": {}
    })
};