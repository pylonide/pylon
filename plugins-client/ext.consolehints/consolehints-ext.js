module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("consolehints", __dirname + "/consolehints");

    register(null, {
        "client.ext.consolehints": {}
    });
};