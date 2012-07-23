/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("core/settings");
var markup = require("text!ext/noderunner/noderunner.xml");
var c9console = require("ext/console/console");
var _debugger = require("ext/debugger/debugger");

module.exports = ext.register("ext/noderunner/noderunner", {
    name    : "Node Runner",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    offline : false,
    autodisable : ext.ONLINE | ext.LOCAL,
    markup  : markup,

    NODE_VERSION: "auto",

    init : function(){
        var _self = this;
        if (ide.connected) {
            this.queryServerState();
            ide.addEventListener("socketDisconnect", function() {
                ide.dispatchEvent("noderunner.stopDebugging")
                console.log("socketDisconnect")
            });
        } else {           
            ide.addEventListener("socketConnect", function() {
                self.queryServerState();
                console.log("socketConnect")
            });
        }
        
        ide.addEventListener("socketMessage", this.onMessage.bind(this));

        ide.addEventListener("consolecommand.run", function(e) {
            ide.send({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "noderunner"
            });
            return false;
        });

        this.nodePid = null;

        ide.addEventListener("settings.load", function(e){
            _self.NODE_VERSION = e.model.queryValue("auto/node-version/@version") || "auto";
        });
    },

    onMessage : function(e) {
        var message = e.message;
        //if (message.type != "shell-data")
           // console.log("MSG", message)

        switch(message.type) {
            case "node-debug-ready":
            case "php-debug-ready":
            case "python-debug-ready":
            case "ruby-debug-ready":
                ide.dispatchEvent("dbg.ready", message);
                break;
            case "node-exit":
            case "php-exit":
            case "python-exit":
            case "ruby-exit":
                ide.dispatchEvent("dbg.exit", message);
                if (message.pid == this.nodePid) {
                    stProcessRunning.deactivate();
                    this.nodePid = 0;
                }
                break;

            case "state":
                this.nodePid = message.processRunning || 0;
                stProcessRunning.setProperty("active", !!message.processRunning);

                dbg.setProperty("strip", message.workspaceDir + "/");
                ide.dispatchEvent("noderunnerready", message);
                break;

            case "error":
                // child process already running
                if (message.code == 1) {
                    stProcessRunning.setProperty("active", true);
                }
                // debug process already running
                else if (message.code == 5) {
                    stProcessRunning.setProperty("active", true);
                }
                /*
                    6:
                    401: Authorization Required
                */
                // Command error
                else if (message.code === 9) {
                    c9console.log("<div class='item console_log' style='font-weight:bold;color:yellow'>"
                        + message.message + "</div>");
                }
                else if (message.code !== 6 && message.code != 401 && message.code != 455 && message.code != 456) {
                    c9console.log("<div class='item console_log' style='font-weight:bold;color:#ff0000'>[C9 Server Exception "
                        + (message.code || "") + "] " + message.message + "</div>");

                    apf.ajax("/api/debug", {
                        method      : "POST",
                        contentType : "application/json",
                        data        : JSON.stringify({
                            agent   : navigator.userAgent,
                            type    : "C9 SERVER EXCEPTION",
                            code    : e.code,
                            message : e.message
//                            log     : apf.console.debugInfo.join("\n")
                        })
                    });
                }

                this.queryServerState();
                break;
        }
    },

    queryServerState : function() {
        // load the state, which is quite a weird name actually, but it contains
        // info about the debugger. The response is handled by 'noderunner.js'
        // who publishes info for the UI of the debugging controls based on this.
        ide.send({command: "state", action: "publish" });
    },

    debug : function() {
    },

    run : function(path, args, debug, nodeVersion) {
        var runner;
        
        // this is a manual action, so we'll tell that to the debugger
        _debugger.registerManualAttach();
        if (stProcessRunning.active || typeof path != "string")
            return false;
        // TODO there should be a way to set satate to waiting
        stProcessRunning.activate()

        path = path.trim();

        if (nodeVersion == 'default' || !nodeVersion) {
            runner = this.detectRunner(path);
            nodeVersion = runner == 'node' ? settings.model.queryValue("auto/node-version/@version") || this.NODE_VERSION : 'auto';
        } else {
            runner = nodeVersion.split(" ")[0];
            nodeVersion = nodeVersion.split(" ")[1] || 'auto';
        }

        var page = ide.getActivePageModel();
        var command = {
            "command" : apf.isTrue(debug) ? "RunDebugBrk" : "Run",
            "file"    : path.replace(/^\/+/, ""),
            "runner"  : runner,
            "args"    : args || "",
            "version" : nodeVersion,
            "env"     : {
                "C9_SELECTED_FILE": page ? page.getAttribute("path").slice(ide.davPrefix.length) : ""
            }
        };
        ide.send(command);
    },

    stop : function() {
        if (!stProcessRunning.active)
            return;

        ide.send({
            "command": "kill",
            "runner" : "node",
            "pid"    : this.nodePid
        });
        ide.send({"command": "state", "action": "publish"});
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    },
    
    detectRunner: function(path) {
        if (path.match(/\.(php|phtml)$/))
            return "php";
        
        if (path.match(/\.py$/))
            return "python";
        
        if (path.match(/\.rb$/))
            return "ruby";
        
        return "node";
    }
});

});
