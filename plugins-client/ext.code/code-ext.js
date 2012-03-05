module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("code", __dirname);
    register(null, {
        "ext.code": {}
    })
};