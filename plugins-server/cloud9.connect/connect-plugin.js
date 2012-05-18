var netutil = require("../cloud9.core/netutil");
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
        }
    };
    hookNames.forEach(function(name) {
        var hookServer = connect();
        server.use(hookServer);
        api["use" + name] = hookServer.use.bind(hookServer);
    });

    api.useSetup(connect.cookieParser());
    api.useSetup(connect.bodyParser());

    api.addRoute = server.addRoute;
    api.use = api.useStart;

    api.on = server.on;
    api.emit = server.emit;
    api.close = server.close;

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

            startListening(port, options.host);
        });
    } else {
        startListening(options.port, options.host);
    }
};