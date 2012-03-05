module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("noderunner", __dirname);
    register(null, {
        "ext.noderunner": {}
    })
};