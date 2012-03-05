module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("nodeunit", __dirname + "/nodeunit");

    register(null, {
        "client.ext.nodeunit": {}
    });
};