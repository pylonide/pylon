/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var debug = require("apf/elements/debugger");
var debugHost = require("apf/elements/debughost");

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/noderunner/noderunner.xml");

module.exports = ext.register("ext/noderunner/noderunner", {
    name    : "Node Runner",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    offline : false,
    markup  : markup,
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

        dbg.addEventListener("break", function(e){
            ide.dispatchEvent("break", e);
        });

        dbgNode.addEventListener("onsocketfind", function() {
            return ide.socket;
        });

        stDebugProcessRunning.addEventListener("activate", this.$onDebugProcessActivate.bind(this));
        stDebugProcessRunning.addEventListener("deactivate", this.$onDebugProcessDeactivate.bind(this));

        ide.addEventListener("consolecommand.run", function(e) {
            ide.send(JSON.stringify({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "noderunner"
            }));
            return false;
        });
    },

    $onDebugProcessActivate : function() {
        dbg.attach(dbgNode, 0);
    },

    $onDebugProcessDeactivate : function() {
        dbg.detach(function(){});
    },

    onMessage : function(e) {
        var message = e.message;
        //console.log("MSG", message)

        switch(message.type) {
            case "node-debug-ready":
                ide.dispatchEvent("debugready");
                break;

            case "chrome-debug-ready":
                winTab.show();
                dbgChrome.loadTabs();
                ide.dispatchEvent("debugready");
                break;

            case "node-exit":
                stProcessRunning.deactivate();
                stDebugProcessRunning.deactivate();
                break;
                
            case "node-exit-with-error":
                stProcessRunning.deactivate();
                stDebugProcessRunning.deactivate();

                // TODO: is this the way to report an errror?
                txtOutput.addValue("<div class='item console_log' style='font-weight:bold;color:#ff0000'>[C9 Server Exception: " 
                        + message.errorMessage + "</div>");
                break;

            case "state":
                
                stDebugProcessRunning.setProperty("active", message.debugClient || message.nodeDebugClient);
                stProcessRunning.setProperty("active", message.processRunning || message.nodeProcessRunning || message.pythonProcessRunning);
                dbgNode.setProperty("strip", message.workspaceDir + "/");
                ide.dispatchEvent("noderunnerready");
                break;

            case "error":
                /*
                    6:
                    401: Authorization Required
                */
                // Command error
                if (message.code === 9) {
                    txtConsole.addValue("<div class='item console_log' style='font-weight:bold;color:yellow'>"
                        + message.message + "</div>");
                }
                else if (message.code !== 6 && message.code != 401 && message.code != 455 && message.code != 456) {
                    //util.alert("Server Error", "Server Error " 
                    //    + (message.code || ""), message.message);

                    txtConsole.addValue("<div class='item console_log' style='font-weight:bold;color:#ff0000'>[C9 Server Exception " 
                        + (message.code || "") + "] " + message.message.message + "</div>");
                    
                    apf.ajax("/debug", {
                        method      : "POST",
                        contentType : "application/json",
                        data        : apf.serialize({
                            agent   : navigator.userAgent,
                            type    : "C9 SERVER EXCEPTION",
                            code    : e.code,
                            message : e.message
//                            log     : apf.console.debugInfo.join("\n")
                        })
                    });
                }
                
                ide.send('{"command": "state"}');
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
        ide.send(JSON.stringify(command));
    },

    debug : function() {
        this.$run(true);
    },

    run : function(path, args, debug) {
        // this is a manual action, so we'll tell that to the debugger
        dbg.registerManualAttach();
        
        if (stProcessRunning.active || !stServerConnected.active/* || (ddRunnerSelector.value=='gae' ? '' : !path)*/ || typeof path != "string")
            return false;

        var page = ide.getActivePageModel();
        var command = {
            "command" : apf.isTrue(debug) ? "RunDebugBrk" : "Run",
            "file"    : path.replace(/^\/+/, ""),
            "runner"  : "node", //ddRunnerSelector.value, // Explicit addition; trying to affect as less logic as possible for now...
            "args"    : args || "",
            "env"     : {
                "C9_SELECTED_FILE": page ? page.getAttribute("path").slice(ide.davPrefix.length) : ""
            }
        };
        ide.send(JSON.stringify(command));

        if (debug)
            stDebugProcessRunning.activate();

        stProcessRunning.activate();
    },

    stop : function() {
        if (!stProcessRunning.active)
            return;

        ide.send(JSON.stringify({
            "command": "kill",
            "runner"  : "node" //ddRunnerSelector.value // Explicit addition; trying to affect as less logic as possible for now...
        }));
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});