module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("ftp", __dirname + "/ftp");

    register(null, {
        "client.ext.ftp": {}
    });
};