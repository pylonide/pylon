module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("tree", __dirname);
    register(null, {
        "ext.tree": {}
    })
};