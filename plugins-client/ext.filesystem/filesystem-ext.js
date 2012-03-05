module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("filesystem", __dirname);
    register(null, {
        "ext.filesystem": {}
    })
};