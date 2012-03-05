module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("themes", __dirname);
    register(null, {
        "ext.themes": {}
    })
};