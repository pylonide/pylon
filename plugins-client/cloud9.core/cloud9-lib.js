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

    imports.static.favicon(__dirname + "/www/favicon.ico");
    
    register(null, {
        "client.cloud9": {}
    });
};