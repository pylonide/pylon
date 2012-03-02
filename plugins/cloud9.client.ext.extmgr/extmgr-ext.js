module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("extmgr", __dirname + "/extmgr");

    register(null, {
        "client.ext.extmgr": {}
    });
};