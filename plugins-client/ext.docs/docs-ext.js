module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("docs", __dirname);
    register(null, {
        "ext.docs": {}
    })
};