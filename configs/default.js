var fs = require("fs");

var clientExtensions = {};
var clientDirs = fs.readdirSync(__dirname + "/../plugins-client");
for (var i = 0; i < clientDirs.length; i++) {
    var dir = clientDirs[i];
    if (dir.indexOf("ext.") !== 0)
        continue;

    var name = dir.split(".")[1];
    clientExtensions[name] = __dirname + "/../plugins-client/" + dir;
}

var projectDir = __dirname + "/../";
var fsUrl = "/workspace";

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
                packagePath: __dirname + "/../plugins-server/cloud9.sourcemint",
                prefix: "/static/bundles"
            }, {
                packagePath: __dirname + "/../plugins-server/cloud9.static",
                prefix: "/static"
            },
            __dirname + "/../plugins-server/cloud9.alive",


            // Client libraries
            __dirname + "/../plugins-client/cloud9.core",
            __dirname + "/../plugins-client/lib.ace",
            __dirname + "/../plugins-client/lib.apf",
            __dirname + "/../plugins-client/lib.treehugger",
            __dirname + "/../plugins-client/lib.v8debug",

            // server plugins
            {
                packagePath: __dirname + "/../plugins-server/cloud9.core",
                projectDir: projectDir,
                fsUrl: fsUrl,
                workspaceId: "Cloud9",
                clientPlugins: [
                    "ext/filesystem/filesystem",
                    "ext/settings/settings",
                    "ext/editors/editors",
                    "ext/themes/themes",
                    "ext/themes_default/themes_default",
                    "ext/panels/panels",
                    "ext/dockpanel/dockpanel",
                    "ext/openfiles/openfiles",
                    "ext/tree/tree",
                    "ext/save/save",
                    "ext/recentfiles/recentfiles",
                    "ext/gotofile/gotofile",
                    "ext/newresource/newresource",
                    "ext/undo/undo",
                    "ext/clipboard/clipboard",
                    "ext/searchinfiles/searchinfiles",
                    "ext/searchreplace/searchreplace",
                    "ext/quickwatch/quickwatch",
                    "ext/quicksearch/quicksearch",
                    "ext/gotoline/gotoline",
                    "ext/html/html",
                    "ext/help/help",
                    //"ext/ftp/ftp",
                    "ext/code/code",
                    "ext/statusbar/statusbar",
                    "ext/imgview/imgview",
                    //"ext/preview/preview",
                    "ext/extmgr/extmgr",
                    //"ext/run/run", //Add location rule
                    "ext/runpanel/runpanel", //Add location rule
                    "ext/debugger/debugger", //Add location rule
                    "ext/noderunner/noderunner", //Add location rule
                    "ext/console/console",
                    "ext/consolehints/consolehints",
                    "ext/tabbehaviors/tabbehaviors",
                    "ext/tabsessions/tabsessions",
                    "ext/keybindings/keybindings",
                    "ext/keybindings_default/keybindings_default",
                    "ext/watcher/watcher",
                    "ext/dragdrop/dragdrop",
                    "ext/beautify/beautify",
                    "ext/offline/offline",
                    "ext/stripws/stripws",
                    "ext/testpanel/testpanel",
                    "ext/nodeunit/nodeunit",
                    "ext/zen/zen",
                    "ext/codecomplete/codecomplete",
                    //"ext/autosave/autosave",
                    "ext/vim/vim",
                    "ext/guidedtour/guidedtour",
                    "ext/quickstart/quickstart",
                    "ext/jslanguage/jslanguage",
                    "ext/autotest/autotest",
                    "ext/tabsessions/tabsessions",
                    "ext/closeconfirmation/closeconfirmation",
                    "ext/codetools/codetools",
                    "ext/colorpicker/colorpicker"
                    //"ext/acebugs/acebugs"
                ]
            }, {
                packagePath: __dirname + "/../plugins-server/cloud9.fs",
                mountDir: projectDir,
                urlPrefix: fsUrl
            },
            __dirname + "/../plugins-server/cloud9.socket",
            __dirname + "/../plugins-server/cloud9.session.memory",
            __dirname + "/../plugins-server/cloud9.permissions",
            {
                packagePath: __dirname + "/../plugins-server/cloud9.client-plugins",
                plugins: clientExtensions
            },
            __dirname + "/../plugins-server/cloud9.process-manager",
            __dirname + "/../plugins-server/cloud9.run.shell",
            __dirname + "/../plugins-server/cloud9.run.node",
            __dirname + "/../plugins-server/cloud9.run.node-debug",
            __dirname + "/../plugins-server/cloud9.run.npm",
            __dirname + "/../plugins-server/cloud9.log",
            __dirname + "/../plugins-server/cloud9.ide.auth",
            __dirname + "/../plugins-server/cloud9.ide.blame",
            __dirname + "/../plugins-server/cloud9.ide.git",
            __dirname + "/../plugins-server/cloud9.ide.gittools",
            __dirname + "/../plugins-server/cloud9.ide.hg",
            __dirname + "/../plugins-server/cloud9.ide.npm",
            __dirname + "/../plugins-server/cloud9.ide.run-node",
            __dirname + "/../plugins-server/cloud9.ide.run-python",
            __dirname + "/../plugins-server/cloud9.ide.settings",
            __dirname + "/../plugins-server/cloud9.ide.shell",
            __dirname + "/../plugins-server/cloud9.ide.state",
            __dirname + "/../plugins-server/cloud9.ide.watcher"
            ]
        }
    }
};