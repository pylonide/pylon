module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("help", __dirname + "/help");

    register(null, {
        "client.ext.help": {}
    });
};