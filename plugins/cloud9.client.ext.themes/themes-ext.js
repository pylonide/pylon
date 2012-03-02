module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("themes", __dirname + "/themes");

    register(null, {
        "client.ext.themes": {}
    });
};