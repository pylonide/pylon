module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("richtext", __dirname + "/richtext");

    register(null, {
        "client.ext.richtext": {}
    });
};