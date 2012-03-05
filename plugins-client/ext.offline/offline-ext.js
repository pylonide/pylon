module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("offline", __dirname + "/offline");

    register(null, {
        "client.ext.offline": {}
    });
};