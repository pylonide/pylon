module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("connect", __dirname + "/connect");

    register(null, {
        "client.ext.connect": {}
    });
};