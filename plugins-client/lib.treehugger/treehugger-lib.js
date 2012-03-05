module.exports = function setup(options, imports, register) {
    var base = require.resolve("treehugger/package.json").slice(0, -13);
    imports.static.addStatics([{
        path: base + "/lib",
        mount: "/treehugger/lib",
        rjs: {
            treehugger: "/treehugger/lib/treehugger"
        }
    }]);

    register(null, {
        "client.treehugger": {}
    });
};