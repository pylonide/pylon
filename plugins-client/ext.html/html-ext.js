module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("html", __dirname);
    register(null, {
        "ext.html": {}
    })
};