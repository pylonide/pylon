require("../../../common/paths");
var connect = require("connect");
var IdeServer = require("cloudide/server");

exports.main = function(projectDir, port) {
    server = connect.createServer(
        connect.logger(),
        connect.staticProvider(__dirname + "/../../../client"),
        connect.staticProvider(__dirname + "/../../../common")
    );

//    var server = require("http").createServer();
    server.listen(port);
    new IdeServer(projectDir, server);
};

if (module === require.main) {
    exports.main(".", 3000)
}