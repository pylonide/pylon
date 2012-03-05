module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("offline", __dirname);
    register(null, {
        "ext.offline": {}
    })
};