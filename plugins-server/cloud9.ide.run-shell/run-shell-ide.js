var Plugin = require("cloud9/plugins-server/cloud9.core/plugin");
var util = require("util");

/**
 * This is a plugin that hooks into the IDE plugin space and can therefore do sockets etc.
 */
module.exports = function (runShellPlugin, ide, eventbus, callback) {
    
    var RunShellIdePlugin = function (ide, workspace) {
        Plugin.call(this, ide, workspace);
        
        this.hooks = ["command"];
        
        this.command = function(user, message, client) {
            var _self = this;
            
            if (message.command !== "run-shell") {
                return;
            }
            
            if (!user || !user.permissions || user.permissions.fs !== "rw") {
                // permission denied!
                return;
            }

            switch (message.type) {
                case "run":
                    _self.exec(message.line, message.cwd, message.uniqueId);
                    break;
            }
        };
        
        /**
         * Execute a command!
         */
        this.exec = function (line, cwd, uniqueId) {
            var _self = this;
            
            var send = function (obj) {
                _self.send(_self.extend(obj, {
                    command: "run-shell",
                    uniqueId: uniqueId
                }));
            };
            
            // start the application requested via sh
            runShellPlugin.spawn(workspace.workspaceId, line, cwd, function (err, channel) {
                if (err) {
                    return send({ type: "error", err: err });
                }
                
                var listener = function (msg) {
                    // on exit remove listener
                    if (msg.type === "shell-exit") {
                        eventbus.removeListener(channel, listener);
                    }
                    
                    // send data right through to the user
                    send(msg);
                };
                
                eventbus.on(channel, listener);
            });
        };
        
        // taken from cloud9infra/lib/util.js
        this.extend = function(dest, src){
            var prop, i, x = !dest.notNull;
            if (arguments.length == 2) {
                for (prop in src) {
                    if (x || src[prop])
                        dest[prop] = src[prop];
                }
                return dest;
            }
        
            for (i = 1; i < arguments.length; i++) {
                src = arguments[i];
                for (prop in src) {
                    if (x || src[prop])
                        dest[prop] = src[prop];
                }
            }
            return dest;
        };
    };
    
    util.inherits(RunShellIdePlugin, Plugin);
    
    ide.register("run-shell", RunShellIdePlugin, callback);
};