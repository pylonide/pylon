module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("save", __dirname + "/save");

    register(null, {
        "client.ext.save": {}
    });
};