module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("newresource", __dirname + "/newresource");

    register(null, {
        "client.ext.newresource": {}
    });
};