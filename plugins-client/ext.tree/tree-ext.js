module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("tree", __dirname + "/tree");

    register(null, {
        "client.ext.tree": {}
    });
};