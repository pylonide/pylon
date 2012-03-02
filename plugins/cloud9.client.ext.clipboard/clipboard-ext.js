module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("clipboard", __dirname + "/clipboard");

    register(null, {
        "client.ext.clipboard": {}
    });
};