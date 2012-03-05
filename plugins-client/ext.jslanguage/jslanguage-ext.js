module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("jslanguage", __dirname + "/jslanguage");

    register(null, {
        "client.ext.jslanguage": {}
    });
};