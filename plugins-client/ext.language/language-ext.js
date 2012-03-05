module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("language", __dirname + "/language");

    register(null, {
        "client.ext.language": {}
    });
};