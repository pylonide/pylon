module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("quickwatch", __dirname + "/quickwatch");

    register(null, {
        "client.ext.quickwatch": {}
    });
};