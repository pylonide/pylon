module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("colorpicker", __dirname);
    register(null, {
        "ext.colorpicker": {}
    })
};