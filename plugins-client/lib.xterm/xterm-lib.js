module.exports = function setup(options, imports, register) {
    var base = require.resolve("xterm/package.json").slice(0, -13);
    imports.static.addStatics([{
        path: base + "/dist",
        mount: "/xterm",
        rjs: {
            "xterm": "/xterm/xterm"
        }
    }]);

    imports.static.addStatics([{
        path: base + "/dist/addons/attach",
        mount: "/xterm/addons",
        rjs: {
            "xterm-attach": "/xterm/addons/attach"
        }
    }]);

    imports.static.addStatics([{
        path: base + "/dist/addons/fit",
        mount: "/xterm/addons",
        rjs: {
            "xterm-fit": "/xterm/addons/fit"
        }
    }]);

    register(null, {
        "client.xterm": {}
    });
};