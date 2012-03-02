module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("zen", __dirname + "/zen");

    register(null, {
        "client.ext.zen": {}
    });
};