var fs = require("fs");
var argv = require('optimist').argv;
var path = require("path");

var clientExtensions = {};
var clientDirs = fs.readdirSync(__dirname + "/../plugins-client");
for (var i = 0; i < clientDirs.length; i++) {
    var dir = clientDirs[i];
    if (dir.indexOf("ext.") !== 0)
        continue;

    var name = dir.split(".")[1];
    clientExtensions[name] = __dirname + "/../plugins-client/" + dir;
}

var projectDir = (argv.w && path.resolve(process.cwd(), argv.w)) || process.cwd();
var fsUrl = "/workspace";

var port = argv.p || process.env.PORT || 3131;

module.exports = {
    name: "DAV",
    tmpdir: __dirname + "/../.architect",
    basePath: __dirname + "/../plugins-server",
    containers: {
        master: {
            title: "Cloud9",
            plugins: [{
                packagePath: "./cloud9.connect",
                port: port,
                host: "localhost"
            }, {
                packagePath: "./cloud9.sourcemint",
                prefix: "/static/bundles",
                plugins: clientExtensions
            }, {
                packagePath: "./cloud9.static",
                prefix: "/static"
            },
            "./cloud9.alive",
            "./cloud9.debug",

            // Client libraries
            "./../plugins-client/cloud9.core",
            "./../plugins-client/lib.ace",
            "./../plugins-client/lib.apf",
            "./../plugins-client/lib.treehugger",
            "./../plugins-client/lib.v8debug",
            "./../plugins-client/lib.requirejs",

            // server plugins
            {
                packagePath: "./cloud9.sandbox",
                projectDir: projectDir,
                workspaceId: "Cloud9",
                unixId: null
            }, {
                packagePath: "./cloud9.core",
                fsUrl: fsUrl,
                hosted: false,
                socketIoTransports: [/*"websocket", */"htmlfile", "xhr-multipart", "xhr-polling"],
                bundledPlugins: [
                    "helloworld"
                ],
                real: argv.r,
                clientPlugins: [
                    "ext/packed/packed"
                ]
            }, {
                packagePath: "./cloud9.fs",
                urlPrefix: fsUrl
            },
            "./cloud9.socket",
            {
                packagePath: "./cloud9.session",
                key: "cloud9.sid." + port,
                secret: "1234"
            }, {
                packagePath: "./cloud9.session.file",
                sessionsPath: __dirname + "/../.architect/sessions"
            },
            "./cloud9.permissions",
            {
                packagePath: "./cloud9.client-plugins",
                plugins: clientExtensions
            },
            "./cloud9.eventbus",
            "./cloud9.process-manager",
            "./cloud9.run.shell",
            "./cloud9.run.node",
            "./cloud9.run.node-debug",
            "./cloud9.run.npm",
            "./cloud9.log",
            "./cloud9.ide.auth",
            "./cloud9.ide.blame",
            "./cloud9.ide.git",
            "./cloud9.ide.gittools",
            "./cloud9.ide.hg",
            "./cloud9.ide.npm",
            "./cloud9.ide.run-node",
            "./cloud9.ide.run-python",
            "./cloud9.ide.revisions",
            {
                packagePath: "./cloud9.ide.settings",
                settingsPath: projectDir + "/.settings"
            },
            "./cloud9.ide.shell",
            "./cloud9.ide.state",
            "./cloud9.ide.watcher"
            ]
        }
    }
};