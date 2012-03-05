module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("zen", __dirname);
    register(null, {
        "ext.zen": {}
    })
};