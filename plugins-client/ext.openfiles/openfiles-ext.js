module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("openfiles", __dirname);
    register(null, {
        "ext.openfiles": {}
    })
};