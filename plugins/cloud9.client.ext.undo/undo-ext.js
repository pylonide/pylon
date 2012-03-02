module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("undo", __dirname + "/undo");

    register(null, {
        "client.ext.undo": {}
    });
};