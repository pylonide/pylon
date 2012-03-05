var fs = require("fs");

var clientExtensions = fs.readdirSync(__dirname + "/../plugins-client")
    .filter(function(dir) {
        return dir.indexOf("ext.") === 0;
    })
    .map(function(dir) {
        return __dirname + "/../plugins-client/" + dir;
    });

module.exports = {
    name: "Cloud9",
    tmpdir: __dirname + "/../.architect",
    containers: {
        master: {
            title: "Cloud9",
            plugins: [{
                packagePath: __dirname + "/../plugins-server/cloud9.connect",
                port: process.env.PORT || 3131,
                host: "localhost"
            }, {
                packagePath: __dirname + "/../plugins-server/cloud9.static",
                prefix: "/static"
            },


            // Client libraries
            __dirname + "/../plugins-client/cloud9.core",
            __dirname + "/../plugins-client/lib.ace",
            __dirname + "/../plugins-client/lib.apf",
            __dirname + "/../plugins-client/lib.treehugger",
            __dirname + "/../plugins-client/lib.v8debug",

            // server plugins
            {
                packagePath: __dirname + "/../plugins-server/cloud9.core",
                clientPlugins: [
                    "ext/tree/tree"
                ]
            },
            __dirname + "/../plugins-server/cloud9.client-plugins",
            __dirname + "/../plugins-server/cloud9.log",
            __dirname + "/../plugins-server/cloud9.ide.auth",
            __dirname + "/../plugins-server/cloud9.ide.blame",
            __dirname + "/../plugins-server/cloud9.ide.git",
            __dirname + "/../plugins-server/cloud9.ide.gittools",
            __dirname + "/../plugins-server/cloud9.ide.hg",
            __dirname + "/../plugins-server/cloud9.ide.run-node",
            __dirname + "/../plugins-server/cloud9.ide.run-python",
            __dirname + "/../plugins-server/cloud9.ide.settings",
            __dirname + "/../plugins-server/cloud9.ide.shell",
            __dirname + "/../plugins-server/cloud9.ide.state",
            __dirname + "/../plugins-server/cloud9.ide.watcher"
            ].concat(clientExtensions)
        }
    }
};