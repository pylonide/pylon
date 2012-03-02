module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("codetools", __dirname + "/codetools");

    register(null, {
        "client.ext.codetools": {}
    });
};