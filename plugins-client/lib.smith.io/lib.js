
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
        path: PATH.join(__dirname, "www"),
        mount: "/events/lib",
        rjs: {
            "events": "/events/lib/events"
        },
        router: function(req, res) {
            req.url = "/events.js";
            res.setHeader("Content-Type", "application/javascript");
        }
    }]);

    imports.static.addStatics([{
        path: PATH.dirname(require.resolve("msgpack-js-browser")),
        mount: "/msgpack-js/lib",
        rjs: {
            "msgpack-js": "/msgpack-js/lib/msgpack",
        }
    }]);

    register(null, {
        "client.v8debug": {}
    });
};
