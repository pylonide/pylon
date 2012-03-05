module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("autosave", __dirname + "/autosave");

    register(null, {
        "client.ext.autosave": {}
    });
};