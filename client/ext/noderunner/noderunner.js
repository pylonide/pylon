/**
 * Node Runner Module for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/noderunner/noderunner",
    ["core/ide",
     "core/ext",
     "ext/tree/tree",
     "ext/console/console",
     "text!ext/noderunner/noderunner.xml",
     "/socket.io/socket.io.js"], function(ide, ext, tree, log, markup) {

return ext.register("ext/noderunner/noderunner", {
    name   : "Node Runner",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    deps   : [tree, log],

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
        this.socket.connect();

        dbgNode.addEventListener("onsocketfind", function() {
            return socket;
        });
        dbg.attach(dbgNode);
    },

    onMessage : function(message) {
        try {
            message = JSON.parse(message);
        } catch(e) {
            return;
        }

        //console.log("MSG:", message);
        switch(message.type) {
            case "debug-ready":
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
                this.davPrefix = message.davPrefix;
                break;

            case "node-data":
                //ide.log(message.data);
                log.logNodeStream(message.data, message.stream);
                break;
        }
    },

    onConnect : function() {
        stServerConnected.activate();
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

        var file = tree.trFiles.selected;
        if (!file)
            return;

        if ((file.getAttribute("contenttype") || "").indexOf("application/javascript") != 0)
            return;

        var command = {
            "command" : debug ? "RunDebug" : "Run",
            "file"    : file.getAttribute("path").splice(this.davPrefix.length)
        };
        this.socket.send(JSON.stringify(command));

        if (debug) {
            stDebugProcessRunning.activate();
            ext.setLayoutMode("ext/debugger/debugger");
        }
        else
            log.enable();

        stProcessRunning.activate();
    },

    stop : function() {
        if (!stProcessRunning.active)
            return

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