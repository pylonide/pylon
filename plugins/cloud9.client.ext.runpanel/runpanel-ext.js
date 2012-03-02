module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("runpanel", __dirname + "/runpanel");

    register(null, {
        "client.ext.runpanel": {}
    });
};