module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("gitblame", __dirname + "/gitblame");

    register(null, {
        "client.ext.gitblame": {}
    });
};