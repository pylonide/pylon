module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("dockpanel", __dirname);
    register(null, {
        "ext.dockpanel": {}
    })
};