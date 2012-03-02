module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("autotest", __dirname + "/autotest");

    register(null, {
        "client.ext.autotest": {}
    });
};