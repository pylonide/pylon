module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("gotofile", __dirname + "/gotofile");

    register(null, {
        "client.ext.gotofile": {}
    });
};