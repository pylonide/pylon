module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("run", __dirname);
    register(null, {
        "ext.run": {}
    })
};