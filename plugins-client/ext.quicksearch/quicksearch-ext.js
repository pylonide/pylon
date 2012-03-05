module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("quicksearch", __dirname);
    register(null, {
        "ext.quicksearch": {}
    })
};