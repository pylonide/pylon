module.exports = function setup(options, imports, register) {
    var base = require.resolve("ace/package.json").slice(0, -13);

    imports.static.addStatics([{
        path: base + "/lib",
        mount: "/ace/lib",
        rjs: {
            ace: "/ace/lib/ace"
        }
    }, {
        path: base + "/build/src",
        mount: "/ace/build"
    }, {
        path: __dirname + "/www",
        mount: "/ace"
    }]);

    register(null, {
        "client.ace": {}
    });
};