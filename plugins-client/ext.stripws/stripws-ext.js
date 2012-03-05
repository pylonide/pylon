module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("stripws", __dirname + "/stripws");

    register(null, {
        "client.ext.stripws": {}
    });
};