/**
 * Main IDE object for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var ide; //Global on purpose!!!!

define(function(require, exports, module) {
    var Document = require("core/document");
    var util = require("core/util");

    ide = new apf.Class().$init(); 

    ide.createDocument = function(node, value){
        return new Document(node, value);
    };

    ide.start = function() {
        this.workspaceDir   = window.cloud9config.workspaceDir.replace(/\/+$/, "");
        this.davPrefix      = window.cloud9config.davPrefix.replace(/\/+$/, "");
        this.staticPrefix   = window.cloud9config.staticUrl;
        this.sessionId      = window.cloud9config.sessionId;
        this.workspaceId    = window.cloud9config.workspaceId;
        this.readonly       = window.cloud9config.readonly;
        this.projectName    = window.cloud9config.projectName;
        this.local          = window.cloud9config.local;
        
        this.loggedIn       = true;

        this.onLine         = false;
        this.offlineFileSystemSupport = false;

        this.dispatchEvent("load");
        
       var loc = location.href;
        if (
            location.protocol !== "file:"
            && loc.indexOf("dev") === -1
            && (loc.indexOf("c9.io") > -1))
        {
            window.onerror = function(m, u, l) {
                apf.ajax("/api/debug", {
                    method      : "POST",
                    contentType : "application/json",
                    data        : JSON.stringify({
                        agent       : navigator.userAgent,
                        type        : "General Javascript Error",
                        e           : [m, u, l],
                        workspaceId : ide.workspaceId
                    })
                });
            };
    
            //Catch all APF Routed errors
            apf.addEventListener("error", function(e){
                apf.ajax("/api/debug", {
                    method      : "POST",
                    contentType : "application/json",
                    data        : JSON.stringify({
                        agent       : navigator.userAgent,
                        type        : "APF Error",
                        message     : e.message,
                        tgt         : e.currentTarget && e.currentTarget.serialize(),
                        url         : e.url,
                        state       : e.state,
                        e           : e.error,
                        workspaceId : ide.workspaceId
                    })
                });
            });
        }
    };

    ide.start();

    ide.addEventListener("extload", function() {
        // fire up the socket connection:
        var options = {
            "remember transport": false,
            transports: window.cloud9config.socketIoTransports,
            reconnect: false,
            resource: window.cloud9config.socketIoUrl,
            "connect timeout": 500,
            "try multiple transports": true,
            "transport options": {
                "xhr-polling": {
                    timeout: 60000
                },
                "jsonp-polling": {
                    timeout: 60000
                }
            }
        };

        ide.socketConnect = function() {
            clearInterval(ide.$retryTimer);

            // NOTE: This is a workaround for an init bug in socket.io
            // @see https://github.com/LearnBoost/socket.io-client/issues/390
            if (!ide.socket.socket.transport) {
                // Try and connect until we succeed.
                // NOTE: This may log a connection error to the error console but will recover gracefully and eventually connect.
                ide.socketDisconnect();
            } else {
                ide.socket.json.send({
                    command: "attach",
                    sessionId: ide.sessionId,
                    workspaceId: ide.workspaceId
                });
            }
        };

        ide.socketDisconnect = function() {
            // On disconnect retry every 1 second for 5 seconds then issue `disconnected`
            // and retry every 5 seconds indefinitely.
            var retries = 0;
            function retryTimer(delay) {
                clearInterval(ide.$retryTimer);
                ide.$retryTimer = setInterval(function() {
                    retries += 1;
                    if (retries === 5) {
                        ide.dispatchEvent("socketDisconnect");
                        retryTimer(5000);
                    } else {
                        var sock = ide.socket.socket;
                        if (!sock.connecting && !sock.reconnecting && !ide.testOffline && ide.loggedIn) {
                            sock.connect();
                        }
                    }
                }, delay);
            }
            retryTimer(1000);
        };

        ide.socketMessage = function(message) {
            if (typeof message == "string") {
                try {
                    message = JSON.parse(message);
                }
                catch(e) {
                    window.console && console.error("Error parsing socket message", e, "message:", message);
                    return;
                }
            }

            if (message.type == "attached") {
                ide.dispatchEvent("socketConnect"); //This is called too often!!
            }

            if (message.type === "error") {
                // TODO: Don't display all errors?
                util.alert(
                    "Error on server",
                    "Received following error from server:",
                    JSON.stringify(message.message)
                );
            }
            
            ide.dispatchEvent("socketMessage", {
                message: message
            });
        };

        // for unknown reasons io is sometimes undefined
        try {
            ide.socket = io.connect(null, options);
        }
        catch (e) {
            util.alert(
                "Error starting up",
                "Error starting up the IDE", "There was an error starting up the IDE.<br>Please clear your browser cache and reload the page.",
                function() {
                    window.location.reload();
                }
            );

            var socketIoScriptEl = Array.prototype.slice.call(
                document.getElementsByTagName("script")).filter(function(script) {
                    return script.src && script.src.indexOf("socket.io.js") >= 0;
                }
            )[0];

            var status;
            if (socketIoScriptEl) {
                apf.ajax(socketIoScriptEl.src, {
                    callback: function(data, state, extra) {
                        try {
                            status = parseInt(extra.http.status, 10);
                        } catch(ex) {}
                        apf.dispatchEvent("error", {
                            message: "socket.io client lib not loaded",
                            error: {
                                status: status,
                                state: state,
                                data: data,
                                extra: extra
                            }
                        });
                    }
                });
            } else {
                apf.dispatchEvent("error", {
                    message: "socket.io client lib not loaded",
                    error: e
                });
            }
            return;
        }

        ide.socket.on("message",    ide.socketMessage);
        ide.socket.on("connect",    ide.socketConnect);
        ide.socket.on("disconnect", ide.socketDisconnect);
        this.inited = true;
    });

    ide.$msgQueue = [];
    ide.addEventListener("socketConnect", function() {
        while(ide.$msgQueue.length) {
            var q = ide.$msgQueue;
            ide.$msgQueue = [];
            q.forEach(function(msg) {
                ide.socket.json.send(msg);
            });
        }
    });

    ide.send = function(msg) {
        if (!ide.socket || !ide.socket.socket.connected) {
            ide.$msgQueue.push(msg);
            return;
        }

        ide.socket.json.send(msg);
    };

    ide.getActivePageModel = function() {
        var page = tabEditors.getPage();
        if (!page)
            return null;

        var corrected = this.dispatchEvent("activepagemodel", {
            model: page.$model
        });
        
        return corrected && corrected.data 
            ? corrected.data 
            : page.$model.data;
    };

    ide.getAllPageModels = function() {
        return tabEditors.getPages().map(function(page) {
            return page.$model.data;
        });
    };

    module.exports = ide;
});
