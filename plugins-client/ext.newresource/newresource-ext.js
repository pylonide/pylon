module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("newresource", __dirname);
    register(null, {
        "ext.newresource": {}
    })
};