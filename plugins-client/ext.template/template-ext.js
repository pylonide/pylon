module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("template", __dirname + "/template");

    register(null, {
        "client.ext.template": {}
    });
};