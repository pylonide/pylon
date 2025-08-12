module.exports = function setup(options, imports, register) {
    imports.static.addStatics([{
        path: __dirname + "/www",
        mount: "/hex"
    }]);

    register(null, { "client.hexview": {}});
};