module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("code", __dirname + "/code");

    register(null, {
        "client.ext.code": {}
    });
};