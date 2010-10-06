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
     "text!ext/noderunner/noderunner.xml",
     "/socket.io/socket.io.js"], function(ide, ext, log, markup) {

return ext.register("ext/noderunner/noderunner", {
    name   : "Node Runner",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    deps   : [log],

    nodes : [],

    init : function(amlNode){
        while(tbNoderunner.childNodes.length) {
            var button = tbNoderunner.firstChild;
            ide.barTools.appendChild(button);
            this.nodes.push(button);
        }

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
                dbgNode.setProperty("strip", message.workspaceDir + "/");
                this.davPrefix = message.davPrefix;
                break;

            case "node-data":
                //ide.log(message.data);
                log.logNodeStream(message.data, message.stream);
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

    run : function() {
        this.$run(false);
    },

    $run : function(debug) {
        if (stProcessRunning.active || !stServerConnected.active)
            return;

        page = tabEditors.getPage();
        if (!page)
            return;

        var file = page.$model.data;
        if (!file)
            return;

        if ((file.getAttribute("contenttype") || "").indexOf("application/javascript") != 0)
            return;

        var command = {
            "command" : debug ? "RunDebug" : "Run",
            "file"    : file.getAttribute("path").slice(this.davPrefix.length)
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
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});