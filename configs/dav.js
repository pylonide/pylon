var path = require("path");
var port = process.env.PORT || 3434;
var projectDir = path.normalize(__dirname + "/../");

module.exports = [
    {
        packagePath: "connect-architect/connect",
        port: port,
        host: "localhost"
    }, {
        packagePath: "./cloud9.sandbox",
        projectDir: projectDir,
        workspaceId: "DAV",
        unixId: null
    }, {
        packagePath: "./cloud9.permissions"
    }, {
        packagePath: "connect-architect/connect.session",
        key: "dav.sid." + port,
        secret: "1234"
    }, {
        packagePath: "connect-architect/connect.session.memory"
    }, {
        packagePath: "architect/plugins/architect.log"
    }, {
        packagePath: "vfs-architect/local",
        uid: process.getuid(),
        gid: process.getgid(),
        umask: 0750,
        root: projectDir,
        skipSearchCheck: false,
        httpRoot: "http://localhost:" + port + "/"
    }, {
        packagePath: "./cloud9.fs.vfs",
        urlPrefix: "/"
    }
];