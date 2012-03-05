module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("tabbehaviors", __dirname + "/tabbehaviors");

    register(null, {
        "client.ext.tabbehaviors": {}
    });
};