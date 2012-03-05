module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("guidedtour", __dirname + "/guidedtour");

    register(null, {
        "client.ext.guidedtour": {}
    });
};