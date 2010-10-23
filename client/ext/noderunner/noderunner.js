/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/noderunner/noderunner",
    ["core/ide",
     "core/ext",
     "ext/console/console",
     "ext/filesystem/filesystem",
     "text!ext/noderunner/noderunner.xml",
     "/socket.io/socket.io.js"], function(ide, ext, log, fs, markup) {

return ext.register("ext/noderunner/noderunner", {
    name   : "Node Runner",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    deps   : [log],

    init : function(amlNode){
        var options = {
            transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling'],
            transportOptions: {
                'xhr-polling': {
                    timeout: 30000
                },
                'jsonp-polling': {
                    timeout: 30000
                }
            }
        };

        var socket = this.socket = new io.Socket(null, options);
        this.socket.on("message", this.onMessage.bind(this));
        this.socket.on("connect", this.onConnect.bind(this));
        this.socket.on("disconnect", this.onDisconnect.bind(this));
        this.socket.connect();

        var _self = this;
        dbgNode.addEventListener("onsocketfind", function() {
            return socket;
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

    onMessage : function(message) {
        try {
            message = JSON.parse(message);
        } catch(e) {
            return;
        }
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
                stProcessRunning.setProperty("active", message.processRunning);
                stDebugProcessRunning.setProperty("active", message.debugClient);
                this.workspaceDir = message.workspaceDir;
                fs.setProjectName(this.workspaceDir.replace(/\/+$/, "").split("/").pop());
                dbgNode.setProperty("strip", message.workspaceDir + "/");
                this.davPrefix = message.davPrefix;
                ide.dispatchEvent("noderunnerready");
                break;

            case "node-data":
                //ide.log(message.data);
                log.logNodeStream(message.data, message.stream, this.workspaceDir, this.davPrefix);
                break;
        }
    },

    onConnect : function() {
        clearTimeout(this.$retryTimer);
        stServerConnected.activate();
    },

    onDisconnect : function() {
        stProcessRunning.deactivate();
        stDebugProcessRunning.deactivate();

        clearTimeout(this.$retryTimer);
        var _self = this;
        this.$retryTimer = setTimeout(function() {
            _self.socket.connect();
        }, 2000);
    },

    debugChrome : function() {
        var command = {
            "command" : "RunDebugChrome",
            "file"    : ""
        };
        this.socket.send(JSON.stringify(command));
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
                "C9_SELECTED_FILE": page ? this.workspaceDir + page.getAttribute("path").slice(this.davPrefix.length) : ""
            }
        };
        this.socket.send(JSON.stringify(command));

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
        log.disable();

        this.socket.send(JSON.stringify({"command": "kill"}));
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});