module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("quickwatch", __dirname);
    register(null, {
        "ext.quickwatch": {}
    })
};