module.exports = function setup(options, imports, register) {
    var base = __dirname + "/www";
    imports.static.addStatics([{
        path: base,
        mount: "/",
        rjs: {
            apf: "/apf"
        }
    }]);

    register(null, {
        "client.apf": {}
    });
};