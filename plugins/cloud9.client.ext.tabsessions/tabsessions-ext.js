module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("tabsessions", __dirname + "/tabsessions");

    register(null, {
        "client.ext.tabsessions": {}
    });
};