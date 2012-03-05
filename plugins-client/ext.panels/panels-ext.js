module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("panels", __dirname);
    register(null, {
        "ext.panels": {}
    })
};