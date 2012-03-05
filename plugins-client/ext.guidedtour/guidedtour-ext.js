module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("guidedtour", __dirname);
    register(null, {
        "ext.guidedtour": {}
    })
};