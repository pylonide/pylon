
module.exports = function startup(options, imports, register) {

    var connect = imports.connect;
    var ide = imports.ide;

    var connectModule = connect.getModule();
    var server = connectModule();

    connect.use(ide.baseUrl + "/api", server);

    register(null, {
        use: server.use.bind(server)
    });
};