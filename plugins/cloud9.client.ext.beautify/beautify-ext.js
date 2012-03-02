module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("beautify", __dirname + "/beautify");

    register(null, {
        "client.ext.beautify": {}
    });
};