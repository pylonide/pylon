module.exports = function setup(options, imports, register) {
    var base = require.resolve("v8debug/package.json").slice(0, -13);
    imports.static.addStatics([{
        path: base + "/lib",
        mount: "/v8debug/lib",
        rjs: {
            debug: "/v8debug/lib/v8debug",
            v8debug: "/v8debug/lib/v8debug"
        }
    }]);

    register(null, {
        "client.v8debug": {}
    });
};