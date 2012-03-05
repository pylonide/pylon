module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("editors", __dirname + "/editors");

    register(null, {
        "client.ext.editors": {}
    });
};