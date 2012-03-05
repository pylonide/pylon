module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("dragdrop", __dirname + "/dragdrop");

    register(null, {
        "client.ext.dragdrop": {}
    });
};