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

    server.listen(options.port, options.host, function(err) {
        if (err)
            return register(err);

        imports.log.info("Connect server listening at http://" + options.host + ":" + options.port);

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
};