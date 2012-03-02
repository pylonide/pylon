module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("searchinfiles", __dirname + "/searchinfiles");

    register(null, {
        "client.ext.searchinfiles": {}
    });
};