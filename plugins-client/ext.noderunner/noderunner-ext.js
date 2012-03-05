module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("noderunner", __dirname + "/noderunner");

    register(null, {
        "client.ext.noderunner": {}
    });
};