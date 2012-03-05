module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("gitblame", __dirname);
    register(null, {
        "ext.gitblame": {}
    })
};