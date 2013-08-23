var utils = require("connect/lib/utils");
var netutil = require("netutil");
var connect = require("connect");

module.exports = function startup(options, imports, register) {
    imports.log.info("connect plugin start");

    var server = connect();

    var hookNames = [
        "Start",
        "Setup",
        "Main",
        "Session",
        "Auth",
        "Error"
    ];
    var api = {
        getModule: function() {
            return connect;
        },
        getUtils: function() {
            return utils;
        }
    };
    hookNames.forEach(function(name) {
        var hookServer = connect();
        server.use(hookServer);
        api["use" + name] = function() {
            hookServer.use.apply(hookServer, arguments);
            
            var route = hookServer.stack[hookServer.stack.length-1];
            
            // return "unuse"
            return function() {
                var i = hookServer.stack.indexOf(route);
                if (route >= 0) {
                    console.log("unuse", hookServer.stack[i])
                    hookServer.stack.splice(i, 1);
                }
            };
        };
    });

    api.useSetup(connect.cookieParser());
    api.useSetup(connect.bodyParser());
    if (options.serverId) {
        api.useSetup(function (req, res, next) {
            res.setHeader("X-C9-Server", options.serverId);
            next();
        });
    }

    api.addRoute = server.addRoute;
    api.use = api.useStart;
    api.serverUse = server.use.bind(server);

    api.on = server.on.bind(server);
    api.emit = server.emit.bind(server);

    function startListening (port, host) {
        api.getPort = function () {
            return port;
        };
        api.getHost = function () {
            return host;
        };

        server.listen(port, host, function(err) {
            if (err)
                return register(err);

            imports.log.info("Connect server listening at http://" + host + ":" + port);

            register(null, {
                "onDestruct": function(callback) {
                    server.close();
                    server.on("close", callback);
                },
                "connect": api,
                "http": {
                    getServer: function() {
                        return server;
                    }
                }
            });
        });
    }

    if (options.port instanceof Array) {
        netutil.findFreePort(options.port[0], options.port[1], options.host, function(err, port) {
            if (err)
                return register(err);

            startListening(port, options.host || "localhost");
        });
    } else {
        startListening(options.port, options.host || "localhost");
    }
};