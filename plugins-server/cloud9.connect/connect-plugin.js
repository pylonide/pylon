var connect = require("connect");

/**
 * In this example all interactions with the plugin system are encaplsulated in
 * the startup() function. This makes it easy to test and develop
 * the main functionality (createServer) independently.
 */

var exports = module.exports = function startup(options, imports, register) {
    imports.log.info("connect plugin start");
    var server = exports.createServer();

    server.listen(options.port, options.host, function(err) {
        if (err)
            return register(err);

        imports.log.info("Connect server listening at http://" + options.host + ":" + options.port);

        register(null, {
            "onDestruct": function(callback) {
                server.close();
                server.on("close", callback);
            },
            "connect": {
                addRoute: server.addRoute,
                use: server.use.bind(server)
            },
            "http": {
                getServer: function() {
                    return server;
                }
            }
        });
    });
};

/**
 * The main funcitonality.
 *
 * It is good practice to make this also usable without the plugin system. In
 * bigger plugins this should be extgracted in a separate module
 */
exports.createServer = function(routes) {
    var app;

    var server = connect()
        .use(connect.cookieParser())
        .use(connect.router(function(app_) {
            app = app_;
        }));

    server.addRoute = function(method, route, handler) {
        method = method.toLowerCase() || "get";
        app[method](route, handler);
    };
    return server;
};