module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("extension_template", __dirname + "/extension_template");

    register(null, {
        "client.ext.extension_template": {}
    });
};