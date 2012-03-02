module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("gittools", __dirname + "/gittools");

    register(null, {
        "client.ext.gittools": {}
    });
};