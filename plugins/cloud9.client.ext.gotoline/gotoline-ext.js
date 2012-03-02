module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("gotoline", __dirname + "/gotoline");

    register(null, {
        "client.ext.gotoline": {}
    });
};