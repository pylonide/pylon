module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("run", __dirname + "/run");

    register(null, {
        "client.ext.run": {}
    });
};