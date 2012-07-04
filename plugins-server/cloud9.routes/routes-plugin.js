var middleware = require("../cloud9.core/middleware");

module.exports = function startup(options, imports, register) {

    var connect = imports.connect;
    var ide = imports.ide;

    var connectModule = connect.getModule();
    var server = connectModule();

    server.use(middleware.errorHandler());

    ide.use("/api", server);

    register(null, {
        "ide-routes" : {
            use: function(route, handle) {
                var last = server.stack.pop();
                server.use(route, handle);
                server.stack.push(last);
            }
        }
    });
};