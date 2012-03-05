module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("tabsessions", __dirname);
    register(null, {
        "ext.tabsessions": {}
    })
};