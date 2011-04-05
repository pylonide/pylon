/**
 * Main IDE object for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var deps = ["core/document"];

require.def("core/ide", deps,
    function(Document) {
        var ide = new apf.Class().$init();

        ide.createDocument = function(node, value){
            return new Document(node, value);
        };

        ide.start = function() {
            var last = "";

            //Set references to global elements - aka extension points
            //this.tbMain       = tbMain;
            this.mnuFile      = mnuFile;
            this.mnuEdit      = mnuEdit;
            //this.barMenu      = barMenu;
            this.barTools     = barTools;
            this.sbMain       = sbMain;
            this.vbMain       = vbMain;

            this.workspaceDir = window.cloud9config.workspaceDir.replace(/\/+$/, "");
            this.davPrefix = window.cloud9config.davPrefix.replace(/\/+$/, "");
            this.sessionId = window.cloud9config.sessionId;
            this.workspaceId = window.cloud9config.workspaceId;
            this.readonly = window.cloud9config.readonly;
            this.projectName = window.cloud9config.projectName;

            this.loggedIn = true;

            this.onLine = false;

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
                    if (self.console)
                        console.log("An error occurred, the Cloud9 system admin has been notified.");
                    apf.ajax("/debug", {
                        method      : "POST",
                        contentType : "application/json",
                        data        : apf.serialize({
                            agent       : navigator.userAgent,
                            type        : "General Javascript Error",
                            e           : [m, u, l],
                            workspaceId : ide.workspaceId
//                            log   : apf.console.debugInfo.join("\n")
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
//                            log     : apf.console.debugInfo.join("\n")
                        })
                    });
                });
            }
            else {
                window.onerror = function(m, u, l) {
                    self.console && console.error("An error occurred", m, u, l);
                }
                apf.addEventListener("error", function(e){
                    self.console && console.error("An APF error occurred", e);
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
                rememberTransport: false,
                transports:  ["htmlfile", "xhr-multipart", "flashsocket", "xhr-polling", "jsonp-polling"],
                connectTimeout: 5000,
                transportOptions: {
                    "xhr-polling": {
                        timeout: 60000
                    },
                    "jsonp-polling": {
                        timeout: 60000
                    }
                }
            };

            ide.socketConnect = function() {
                clearTimeout(ide.$retryTimer);

                ide.socket.send(JSON.stringify({
                    command: "attach",
                    sessionId: ide.sessionId,
                    workspaceId: ide.workspaceId
                }));
            };

            ide.socketDisconnect = function() {
                clearTimeout(ide.$retryTimer);
                
                var retries = 0;
                ide.$retryTimer = setInterval(function() {
                    if (++retries == 3)
                        ide.dispatchEvent("socketDisconnect");
                    
                    if (!ide.socket.connecting && !ide.testOffline && ide.loggedIn)
                        ide.socket.connect();
                }, 500);
            };

            ide.socketMessage = function(message) {
                try {
                    message = JSON.parse(message);
                } catch(e) {
                    return;
                }

                if (message.type == "attached")
                    ide.dispatchEvent("socketConnect");

                ide.dispatchEvent("socketMessage", {
                    message: message
                });
            };
            
            //@todo see if this can be moved to noderunner
            ide.addEventListener("socketMessage", function(e){
                if (e.message.type && e.message.type == "state")
                    stProcessRunning.setProperty("active", e.message.processRunning);
            });

            ide.socket = new io.Socket(null, options);
            ide.socket.on("message",    ide.socketMessage);
            ide.socket.on("connect",    ide.socketConnect);
            ide.socket.on("disconnect", ide.socketDisconnect);
            ide.socket.connect();
        });
        
        ide.getActivePageModel = function() {
            page = tabEditors.getPage();
            if (!page)
                return null;
    
            return page.$model.data;
        };
        
        ide.getAllPageModels = function() {
            return tabEditors.getPages().map(function(page) {
                return page.$model.data;
            });
        };

        return ide;
    }
);
