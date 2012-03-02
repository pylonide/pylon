var fs = require("fs");

var skipClientExt = {
    "cloud9.client.ext.richtext": 1,
    "cloud9.client.ext.docs": 1,
    "cloud9.client.ext.gittools": 1,
    "cloud9.client.ext.browser": 1,
    "cloud9.client.ext.acebugs": 1,
    "cloud9.client.ext.refactor": 1
};

var clientExtensions = fs.readdirSync(__dirname + "/../plugins")
    .filter(function(dir) {
        return dir.indexOf("cloud9.client.ext.") === 0 && !skipClientExt[dir];
    })
    .map(function(dir) {
        return {
            packagePath: __dirname + "/../plugins/" + dir
        };
    });

module.exports = {
    name: "Cloud9",
    tmpdir: __dirname + "/../.architect",
    containers: {
        master: {
            title: "Cloud9",
            plugins: [{
                packagePath: __dirname + "/../plugins/cloud9.connect",
                port: process.env.PORT || 3131,
                host: "localhost"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.static",
                prefix: "/static"
            },

            // Client libraries
            {
                packagePath: __dirname + "/../plugins/cloud9.client.ace"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.client.apf"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.client.core"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.client.treehugger"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.client.v8debug"
            },

            {
                packagePath: __dirname + "/../plugins/cloud9.log"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.core"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.ide.auth"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.ide.blame"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.ide.git"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.ide.gittools"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.ide.hg"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.ide.run-node"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.ide.run-python"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.ide.settings"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.ide.shell"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.ide.state"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.ide.watcher"
            }].concat(clientExtensions)
        }
    }
};