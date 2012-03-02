module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("panels", __dirname + "/panels");

    register(null, {
        "client.ext.panels": {}
    });
};