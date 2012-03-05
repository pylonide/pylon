module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("dockpanel", __dirname + "/dockpanel");

    register(null, {
        "client.ext.dockpanel": {}
    });
};