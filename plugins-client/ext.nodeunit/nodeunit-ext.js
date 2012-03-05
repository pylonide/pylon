module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("nodeunit", __dirname);
    register(null, {
        "ext.nodeunit": {}
    })
};