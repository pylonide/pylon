/**
 * Main IDE object for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {
    var Document = require("core/document");
    var util = require("core/util");

    var ide = new apf.Class().$init();

    ide.createDocument = function(node, value){
        return new Document(node, value);
    };

    ide.start = function() {
        //Set references to global elements - aka extension points
        //this.tbMain       = tbMain;
        this.mnuFile        = mnuFile;
        this.mnuEdit        = mnuEdit;
        //this.barMenu      = barMenu;
        this.barTools       = barTools;
        this.sbMain         = sbMain;
        this.vbMain         = vbMain;

        this.workspaceDir   = window.cloud9config.workspaceDir.replace(/\/+$/, "");
        this.davPrefix      = window.cloud9config.davPrefix.replace(/\/+$/, "");
        this.staticPrefix   = window.cloud9config.staticUrl;
        this.sessionId      = window.cloud9config.sessionId;
        this.workspaceId    = window.cloud9config.workspaceId;
        this.readonly       = window.cloud9config.readonly;
        this.projectName    = window.cloud9config.projectName;

        this.loggedIn       = true;
            //Set references to global elements - aka extension points
            //this.tbMain       = tbMain;
            this.mnuFile        = mnuFile;
            this.mnuEdit        = mnuEdit;
            //this.barMenu      = barMenu;
            this.barTools       = barTools;
            this.sbMain         = sbMain;
            this.vbMain         = vbMain;

        this.onLine         = false;
        this.offlineFileSystemSupport = false;

        this.dispatchEvent("load");

        /**** Error Handling ****/

        //Catch all unhandled errors
        var loc = location.href;
        if (
            location.protocol != "file:"
            && loc.indexOf("dev") == -1
            && (loc.indexOf("cloud9ide.com") > -1 || loc.indexOf("c9.io") > -1))
        {
            window.onerror = function(m, u, l) {
                if (window.console)
                    console.log("An error occurred, the Cloud9 system admin has been notified.");
                apf.ajax("/debug", {
                    method      : "POST",
                    contentType : "application/json",
                    data        : apf.serialize({
                        agent       : navigator.userAgent,
                        type        : "General Javascript Error",
                        e           : [m, u, l],
                        workspaceId : ide.workspaceId
                    })
                });
                return true;
            };

            //Catch all APF Routed errors
            apf.addEventListener("error", function(e){
                apf.ajax("/debug", {
                    method      : "POST",
                    contentType : "application/json",
                    data        : apf.serialize({
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
        else {
//                window.onerror = function(m, u, l) {
//                    window.console && console.error("An error occurred", m, u, l);
//                }
            apf.addEventListener("error", function(e){
                window.console && console.error("An APF error occurred", e);
            });
        }
    };

    apf.addEventListener("load", function(){
        ide.start();
    });

    //@todo this doesnt work
    apf.addEventListener("exit", function(){
        //return "Are you sure you want to close Cloud9? Your state will be saved and will be loaded next time you start Cloud9";
    });

    ide.addEventListener("extload", function() {
        // fire up the socket connection:
        var options = {
            "remember transport": false,
            transports:  ["websocket", "htmlfile", "xhr-multipart", "xhr-polling"],
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

            ide.socket.json.send({
                command: "attach",
                sessionId: ide.sessionId,
                workspaceId: ide.workspaceId
            });
        };

        ide.socketReconnect = function() {
            // on a reconnect of the socket.io connection, the server may have
            // lost our session. Now we do an HTTP request to fetch the current
            // session ID and update the Cloud9 config with it. Also, re-attach
            // with the backend.
            apf.ajax("/reconnect", {
                callback: function(data, state, extra) {
                    ide.sessionId = data;
                    ide.socketConnect();
                }
            });
        };

        ide.socketDisconnect = function() {
            clearTimeout(ide.$retryTimer);

            var retries = 0;
            ide.$retryTimer = setInterval(function() {
                if (++retries == 3)
                    ide.dispatchEvent("socketDisconnect");

                var sock = ide.socket.socket;
                if (!sock.connecting && !sock.reconnecting && !ide.testOffline && ide.loggedIn)
                    sock.reconnect();
            }, 1000);
        };

        ide.socketMessage = function(message) {
            try {
                message = JSON.parse(message);
            }
            catch(e) {
                window.console && console.error("Error parsing socket message", e, message);
                return;
            }

            if (message.type == "attached")
                ide.dispatchEvent("socketConnect"); //This is called too often!!

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
        ide.socket.on("reconnect",  ide.socketReconnect);
        //ide.socket.on("reconnecting",  ide.socketReconnecting);
        ide.socket.on("disconnect", ide.socketDisconnect);
        var _oldsend = ide.socket.send;
        ide.socket.send = function(msg) {
            // pass a lambda to enable socket.io ACK
            _oldsend.call(ide.socket, msg, function() {});
        };
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

        return page.$model.data;
    };

    ide.getAllPageModels = function() {
        return tabEditors.getPages().map(function(page) {
            return page.$model.data;
        });
    };

    module.exports = ide;
});
