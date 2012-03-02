module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("html", __dirname + "/html");

    register(null, {
        "client.ext.html": {}
    });
};