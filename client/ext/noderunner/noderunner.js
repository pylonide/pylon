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
        "run": {hint: "run a node program on the server"}
    },

    init : function(amlNode){
        ide.addEventListener("socketDisconnect", this.onDisconnect.bind(this));
        ide.addEventListener("socketMessage", this.onMessage.bind(this));

        dbgNode.addEventListener("onsocketfind", function() {
            return ide.socket;
        });

        stDebugProcessRunning.addEventListener("activate", this.$onDebugProcessActivate.bind(this));
        stDebugProcessRunning.addEventListener("deactivate", this.$onDebugProcessDeactivate.bind(this));
    },

    $onDebugProcessActivate : function() {
        dbg.attach(dbgNode, 0);
        ext.setLayoutMode("ext/debugger/debugger");
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
                //ide.log(message.data);
                log.logNodeStream(message.data, message.stream, ide.workspaceDir, ide.davPrefix);
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
        if (stProcessRunning.active || !stServerConnected.active)
            return;

        var page = ide.getActivePageModel();
        var command = {
            "command" : debug ? "RunDebug" : "Run",
            "file"    : path.replace(/^\/+/, ""),
            "args"    : args || "",
            "env"     : {
                "C9_SELECTED_FILE": page ? ide.workspaceDir + page.getAttribute("path").slice(ide.davPrefix.length) : ""
            }
        };
        ide.socket.send(JSON.stringify(command));

        log.clear();
        if (debug)
            stDebugProcessRunning.activate();

        log.enable();
        stProcessRunning.activate();
    },

    stop : function() {
        if (!stProcessRunning.active)
            return

        ext.setLayoutMode("default");
        //log.disable();

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