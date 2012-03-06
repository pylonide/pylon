module.exports = function setup(options, imports, register) {
    imports["client-plugins"].registerPackage("helloworld", __dirname + "/ui");
    register(null, {
        "ext.helloworld": {}
    })
};