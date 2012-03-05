module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("closeconfirmation", __dirname + "/closeconfirmation");

    register(null, {
        "client.ext.closeconfirmation": {}
    });
};