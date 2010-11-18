/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/noderunner/noderunner",
    ["core/ide",
     "core/ext",
     "core/util",
     "ext/console/console",
     "text!ext/noderunner/noderunner.xml"], 
     function(ide, ext, util, log, markup) {

return ext.register("ext/noderunner/noderunner", {
    name   : "Node Runner",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    deps   : [log],
    commands: {
        "run": {
            "hint": "run a node program on the server",
            "commands": {
                "[PATH]": {"hint": "path pointing to an executable. Autocomplete with [TAB]"}
            }
        }
    },

    init : function(amlNode){
        ide.addEventListener("socketDisconnect", this.onDisconnect.bind(this));
        ide.addEventListener("socketMessage", this.onMessage.bind(this));

        dbgNode.addEventListener("onsocketfind", function() {
            return ide.socket;
        });

        stDebugProcessRunning.addEventListener("activate", this.$onDebugProcessActivate.bind(this));
        stDebugProcessRunning.addEventListener("deactivate", this.$onDebugProcessDeactivate.bind(this));

        ide.addEventListener("consolecommand.run", function(e) {
            ide.socket.send(JSON.stringify({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "noderunner"
            }));
            return false;
        });

        ide.addEventListener("consoleresult.internal-isfile", function(e) {
            var data = e.data;
            if (data.sender != "noderunner")
                return;
            var path = data.cwd.replace(ide.workspaceDir, ide.davPrefix);
            if (data.isfile) {
                require("ext/debugger/debugger").showFile(path);
                require("ext/run/run").run(false);
            }
            else {
                require("ext/console/console").log("'" + path + "' is not a file.");
            }
        });
    },

    $onDebugProcessActivate : function() {
        dbg.attach(dbgNode, 0);
        require("ext/debugger/debugger").enable();
    },

    $onDebugProcessDeactivate : function() {
        dbg.detach();
    },

    onMessage : function(e) {
        var message = e.message;
//        console.log("MSG", message)

        switch(message.type) {
            case "node-debug-ready":
                ide.dispatchEvent("debugready");
                break;

            case "chrome-debug-ready":
                alert("READY")
                winTab.show();
                dbgChrome.loadTabs();
                ide.dispatchEvent("debugready");
                break;

            case "node-exit":
                stProcessRunning.deactivate();
                stDebugProcessRunning.deactivate();
                break;

            case "state":
                stDebugProcessRunning.setProperty("active", message.debugClient);
                dbgNode.setProperty("strip", message.workspaceDir + "/");
                ide.dispatchEvent("noderunnerready");
                break;

            case "node-data":            
                log.logNodeStream(message.data, message.stream, true);
                break;
                
            case "error":
                if (message.code !== 6)
                    util.alert("Server Error", "Server Error", message.message);
                ide.socket.send('{"command": "state"}');
                break;
                
        }
    },

    onDisconnect : function() {
        stDebugProcessRunning.deactivate();
    },

    debugChrome : function() {
        var command = {
            "command" : "RunDebugChrome",
            "file"    : ""
        };
        ide.socket.send(JSON.stringify(command));
    },

    debug : function() {
        this.$run(true);
    },

    run : function(path, args, debug) {
        if (stProcessRunning.active || !stServerConnected.active || !path)
            return false;

        var page = ide.getActivePageModel();
        var command = {
            "command" : debug ? "RunDebugBrk" : "Run",
            "file"    : path.replace(/^\/+/, ""),
            "args"    : args || "",
            "env"     : {
                "C9_SELECTED_FILE": page ? ide.workspaceDir + page.getAttribute("path").slice(ide.davPrefix.length) : ""
            }
        };
        ide.socket.send(JSON.stringify(command));

        log.clear();
        log.showOutput();

        if (debug)
            stDebugProcessRunning.activate();

        log.enable();
        stProcessRunning.activate();
    },

    stop : function() {
        if (!stProcessRunning.active)
            return

        require("ext/debugger/debugger").disable();
        ide.socket.send(JSON.stringify({"command": "kill"}));
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});