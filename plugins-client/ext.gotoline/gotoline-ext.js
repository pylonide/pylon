module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("gotoline", __dirname);
    register(null, {
        "ext.gotoline": {}
    })
};