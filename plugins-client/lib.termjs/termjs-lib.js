module.exports = function setup(options, imports, register) {
    var base = require.resolve("term.js/package.json").slice(0, -13);
    imports.static.addStatics([{
        path: base + "/src",
        mount: "/term.js/lib",
        rjs: {
            "termjs": "/term.js/lib/term"
        }
    }]);

    register(null, {
        "client.termjs": {}
    });
};