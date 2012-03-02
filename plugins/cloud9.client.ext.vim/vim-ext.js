module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("vim", __dirname + "/vim");

    register(null, {
        "client.ext.vim": {}
    });
};