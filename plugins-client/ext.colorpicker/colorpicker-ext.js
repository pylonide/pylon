module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("colorpicker", __dirname + "/colorpicker");

    register(null, {
        "client.ext.colorpicker": {}
    });
};