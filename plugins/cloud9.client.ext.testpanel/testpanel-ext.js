module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("testpanel", __dirname + "/testpanel");

    register(null, {
        "client.ext.testpanel": {}
    });
};