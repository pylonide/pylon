module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("refactor", __dirname + "/refactor");

    register(null, {
        "client.ext.refactor": {}
    });
};