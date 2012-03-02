module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("themes_default", __dirname + "/themes_default");

    register(null, {
        "client.ext.themes_default": {}
    });
};