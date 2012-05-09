module.exports = function setup(options, imports, register) {
    var base = __dirname + "/www";
    imports.static.addStatics([{
        path: base,
        mount: "/",
        rjs: {
            core: "/core",
            ext: "/ext"
        }
    }]);
    
    register(null, {
        "client.cloud9": {}
    });
};