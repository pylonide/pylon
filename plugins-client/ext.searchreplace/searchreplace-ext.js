module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("searchreplace", __dirname + "/searchreplace");

    register(null, {
        "client.ext.searchreplace": {}
    });
};