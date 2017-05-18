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
        path: base + "/dist/addons",
        mount: "/xterm/addons",
        rjs: {
          "xterm-attach": "/xterm/addons/attach/attach",
          "xterm-fit": "/xterm/addons/fit/fit",
          "xterm-fullscreen": "/xterm/addons/fullscreen/fullscreen",
          "xterm-linkify": "/xterm/addons/linkify/linkify",
          "xterm-terminado": "/xterm/addons/terminado/terminado"
        }
    }]);

    register(null, {
        "client.xterm": {}
    });
};