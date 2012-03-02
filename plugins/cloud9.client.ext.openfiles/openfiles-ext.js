module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("openfiles", __dirname + "/openfiles");

    register(null, {
        "client.ext.openfiles": {}
    });
};