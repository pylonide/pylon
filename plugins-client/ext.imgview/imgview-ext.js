module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("imgview", __dirname + "/imgview");

    register(null, {
        "client.ext.imgview": {}
    });
};