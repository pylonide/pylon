module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("acebugs", __dirname + "/acebugs");

    register(null, {
        "client.ext.acebugs": {}
    });
};