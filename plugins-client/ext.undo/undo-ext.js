module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("undo", __dirname);
    register(null, {
        "ext.undo": {}
    })
};