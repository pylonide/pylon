
module.exports = function startup(options, imports, register) {

    var connect = imports.connect;
    var ide = imports.ide;

    var connectModule = connect.getModule();
    var server = connectModule();

    ide.use("/api", server);

    register(null, {
        "ide-routes" : {
            use: server.use.bind(server)
        }
    });
};