module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("splitview", __dirname + "/splitview");

    register(null, {
        "client.ext.splitview": {}
    });
};