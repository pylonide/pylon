module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("filesystem", __dirname + "/filesystem");

    register(null, {
        "client.ext.filesystem": {}
    });
};