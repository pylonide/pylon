
const PATH = require("path");

module.exports = function setup(options, imports, register) {

    imports.static.addStatics([{
        path: PATH.dirname(require.resolve("engine.io-client/dist/engine.io.js")),
        mount: "/engine.io/lib",
        rjs: {
            "engine.io": "/engine.io/lib/engine.io",
            "smith.io": "/smith.io/client"
        }
    }]);

    imports.static.addStatics([{
        path: PATH.dirname(require.resolve("smith")),
        mount: "/smith/lib",
        rjs: {
            "smith": "/smith/lib/smith",
        }
    }]);

    imports.static.addStatics([{
        path: PATH.dirname(require.resolve("events/events")),
        mount: "/events/lib",
        rjs: {
            "events": "/events/lib/events",
        }
    }]);

    imports.static.addStatics([{
        path: PATH.dirname(require.resolve("browser-msgpack-js")),
        mount: "/msgpack-js/lib",
        rjs: {
            "msgpack-js": "/msgpack-js/lib/msgpack",
        }
    }]);

    imports.static.addStatics([{
        path: PATH.join(__dirname, "www"),
        mount: "/raw.github.com/Gozala/extendables/v0.2.0/extendables.js",
        rjs: {
            "extendables": "/"
        },
        router: function(req, res) {
            req.url = "/extendables.js";
            res.setHeader("Content-Type", "application/javascript");
        }
    }]);

    register(null, {
        "client.v8debug": {}
    });
};
