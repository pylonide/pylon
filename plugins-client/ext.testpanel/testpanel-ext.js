module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("testpanel", __dirname);
    register(null, {
        "ext.testpanel": {}
    })
};