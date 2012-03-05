module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("debugger", __dirname + "/debugger");

    register(null, {
        "client.ext.debugger": {}
    });
};