module.exports = function setup(options, imports, register) {
    imports.ide.registerClientPlugin("quicksearch", __dirname + "/quicksearch");

    register(null, {
        "client.ext.quicksearch": {}
    });
};