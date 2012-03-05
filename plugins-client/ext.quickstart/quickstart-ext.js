module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("quickstart", __dirname + "/quickstart");

    register(null, {
        "client.ext.quickstart": {}
    });
};