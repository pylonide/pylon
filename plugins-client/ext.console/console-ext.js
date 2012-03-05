module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("console", __dirname + "/console");

    register(null, {
        "client.ext.console": {}
    });
};