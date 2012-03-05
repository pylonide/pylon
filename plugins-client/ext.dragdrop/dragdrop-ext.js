module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("dragdrop", __dirname);
    register(null, {
        "ext.dragdrop": {}
    })
};