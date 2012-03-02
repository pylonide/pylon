module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("browser", __dirname + "/browser");

    register(null, {
        "client.ext.browser": {}
    });
};