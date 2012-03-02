module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("codecomplete", __dirname + "/codecomplete");

    register(null, {
        "client.ext.codecomplete": {}
    });
};