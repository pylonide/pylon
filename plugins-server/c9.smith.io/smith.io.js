/*global require setTimeout clearTimeout module __dirname console*/
"use strict";
var ASSERT = require("assert");
var PATH = require("path");
var FS = require("fs");
var SMITH = require("smith");
var ENGINE_IO = require("engine.io");
var EVENTS = require("events");

// Switch from `away` to `disconnect` after this many milliseconds.
var RECONNECT_TIMEOUT = 60 * 1000;

var IMPORTS;
var serverId;

module.exports = function startup(options, imports, register) {

    if (options.registerClientRoutes !== false) {

        imports["static"].addStatics([{
            path: PATH.dirname(require.resolve("engine.io-client/engine.io.js")),
            mount: "/engine.io",
            rjs: [
                {
                    "name": "engine.io",
                    "location": "engine.io",
                    "main": "engine.io.js"
                }
            ]
        }]);

        imports["static"].addStatics([{
            path: PATH.join(__dirname, "www"),
            mount: "/smith.io",
            rjs: [
                {
                    "name": "smith.io",
                    "location": "smith.io",
                    "main": "client.js"
                }
            ]
        }]);

        imports["static"].addStatics([{
            path: PATH.dirname(require.resolve("smith")),
            mount: "/smith",
            rjs: [
                {
                    "name": "smith",
                    "location": "smith",
                    "main": "smith.js"
                }
            ]
        }]);

        imports["static"].addStatics([{
            path: PATH.dirname(require.resolve("msgpack-js-browser")),
            mount: "/msgpack-js",
            rjs: [
                {
                    "name": "msgpack-js",
                    "location": "msgpack-js",
                    "main": "msgpack.js"
                }
            ]
        }]);
    }

    serverId = options.serverId || ("server-id-" + Date.now());
    IMPORTS = imports;

    register(null, {
        "smith.io": {
            "createServer": function (urlCheck, onConnection, connectionHooks) {
                createSmithIoServer(urlCheck, onConnection, connectionHooks || {});
            }
        }
    });
};

function createSmithIoServer(urlCheck, onConnection, connectionHooks) {
    var connections = {};
    var timeouts = {};
    var buffers = {};

    var server = IMPORTS.http.getServer();

    var match = function() { return true; };
    var resourcePath;
    if (typeof urlCheck === "string") {
        match = function (url) {
            return urlCheck === url.substr(0, urlCheck.length) &&
                (onConnection || connectionHooks[urlCheck]);
        };
    }
    else if (typeof urlCheck === "object") {
        match = function (url) {
            var m = urlCheck.exec(url);
            return (onConnection || connectionHooks[m && m[1]]) && m;
        };
    }

    var engine = engineForResource(server, match, serverId);

    engine.on("connection", function (socket) {
        var url = socket.request.url;
        var m = match(url);
        if (!m)
            return;

        var transport = new SMITH.EngineIoTransport(socket);
        var id = false;

        transport.on("legacy", function (message) {
            if (typeof message === "object" && message.type === "__ANNOUNCE-ID__") {
                id = message.id;
                if (timeouts[id]) {
                    clearTimeout(timeouts[id]);
                    delete timeouts[id];
                }
                if (!connections[id]) {
                    connections[id] = {
                        ee: new EVENTS.EventEmitter(),
                        transport: transport
                    };

                    var connectionHook = connectionHooks[m[1]] || onConnection;

                    connectionHook({
                        id: id,
                        transport: connections[id].transport,
                        on: connections[id].ee.on.bind(connections[id].ee),
                        once: connections[id].ee.once.bind(connections[id].ee),
                        send: function(message) {
                            if (timeouts[id]) {
                                if (!buffers[id]) {
                                    buffers[id] = [];
                                }
                                buffers[id].push(message);
                            } else if (connections[id]) {
                                connections[id].transport.send(message);
                            }
                        }
                    });
                } else {
                    connections[id].transport = transport;
                    if (buffers[id]) {
                        buffers[id].forEach(function(message) {
                            connections[id].transport.send(message);
                        });
                        delete buffers[id];
                    }
                    connections[id].ee.emit("back", {transport: transport});
                }
            } else if (connections[id]) {
                connections[id].ee.emit("message", message);
            }
        });

        transport.on("disconnect", function (reason) {
            if (id === false || !connections[id]) {
                // Connection was never announced so we can just stop here.
                return;
            }
            timeouts[id] = setTimeout(function() {
                // the connection might not exist on the server
                if (connections[id]) {
                    connections[id].ee.emit("disconnect", reason);
                    delete connections[id];
                }
                id = false;
            }, RECONNECT_TIMEOUT);
            connections[id].ee.emit("away");
        });

        transport.send({
            type: "__ASSIGN-ID__",
            id: socket.id + "-" + Date.now(),
            serverId: serverId
        });
    });
}

function engineForResource(server, check, serverId) {
    var engine = attachEngineIo(server, {
        check: check,
        pingTimeout: 3000,
        pingInterval: 15000,
        pongPayload: {
            serverId: serverId
        }
//        transports: ["polling"]
    });

    engine.on("error", function(err) {
        console.error(err.stack);
    });

    return engine;
}

// Copied from engine.io@0.5.0 exports.attach (replacing path chech with function-based-check)
function attachEngineIo(server, options) {
  var engine = new ENGINE_IO.Server(options);
  options = options || {};

  var destroyUpgrade = (options.destroyUpgrade !== undefined) ? options.destroyUpgrade : true;
  var destroyUpgradeTimeout = options.destroyUpgradeTimeout || 1000;

  // cache and clean up listeners
  var listeners = server.listeners('request').slice(0);
  server.removeAllListeners('request');
  server.on('close', engine.close.bind(engine));

  // add request handler
  server.on('request', function(req, res){
    if (options.check(req.url)) {
      engine.handleRequest(req, res);
    } else {
      for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i].call(server, req, res);
      }
    }
  });

  if(~engine.transports.indexOf('websocket')) {
    server.on('upgrade', function (req, socket, head) {
      if (options.check(req.url)) {
        engine.handleUpgrade(req, socket, head);
      } else if (false !== options.destroyUpgrade) {
        // default node behavior is to disconnect when no handlers
        // but by adding a handler, we prevent that
        // and if no eio thing handles the upgrade
        // then the socket needs to die!
        setTimeout(function() {
           if (socket.writable && socket.bytesWritten <= 0) {
             return socket.end();
           }
        }, options.destroyUpgradeTimeout);
      }
    });
  }

  // flash policy file
  var trns = engine.transports;
  var policy = options.policyFile;
  if (~trns.indexOf('flashsocket') && false !== policy) {
    server.on('connection', function (socket) {
      engine.handleSocket(socket);
    });
  }

  return engine;
}
