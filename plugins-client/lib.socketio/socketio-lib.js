module.exports = function setup(options, imports, register) {
    var base = require.resolve("socket.io/package.json").slice(0, -13);
    imports.static.addStatics([{
        path: base + "/node_modules/socket.io-client/dist",
        mount: "/socket.io/lib",
        rjs: {
            "socket.io": "/socket.io/lib/socket.io"
        }
    }]);

    register(null, {
        "client.socketio": {}
    });
};