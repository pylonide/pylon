module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("docs", __dirname + "/docs");

    register(null, {
        "client.ext.docs": {}
    });
};