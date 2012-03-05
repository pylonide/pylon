module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("formatjson", __dirname + "/formatjson");

    register(null, {
        "client.ext.formatjson": {}
    });
};