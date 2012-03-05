module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("splitview", __dirname);
    register(null, {
        "ext.splitview": {}
    })
};