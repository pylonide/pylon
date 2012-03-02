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
            }, {
                packagePath: __dirname + "/../plugins/cloud9.client.ace"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.client.apf"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.client.core"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.client.treehugger"
            }, {
                packagePath: __dirname + "/../plugins/cloud9.client.v8debug"
            }, {
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
            }]
        }
    }
};