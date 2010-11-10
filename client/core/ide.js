/**
 * Main IDE object for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("core/ide", ["core/document", "/socket.io/socket.io.js"],
    function(Document) {
        var ide = new apf.Class().$init();

        ide.createDocument = function(node, value){
            return new Document(node, value);
        };

        ide.start = function() {
            var last = "";

            //Set references to global elements - aka extension points
            this.tbMain       = tbMain;
            this.mnuFile      = mnuFile;
            this.mnuEdit      = mnuEdit;
            this.barMenu      = barMenu;
            this.barTools     = barTools;
            this.sbMain       = sbMain;
            this.vbMain       = vbMain;

            this.dispatchEvent("load");

            /**** Error Handling ****/

            //Catch all unhandled errors
            var loc = location.href;
            if (false && location.protocol != "file:"
              && loc.indexOf("dev") == -1
              && loc.indexOf("cloud9ide.com") > -1) {
                window.onerror = function(m, u, l) {
                    if (self.console)
                        console.log("An error occurred, the Cloud9 system admin has been notified.")
                    apf.ajax("/debug", {
                        method      : "POST",
                        contentType : "application/json",
                        data        : apf.serialize({
                            agent : navigator.userAgent,
                            uid   : ide.userId,
                            loc   : ide.loc,
                            creds : self.auth && auth.getCredentials()[0],
                            type  : "General Javascript Error",
                            e     : [m, u, l],
                            log   : apf.console.debugInfo.join("\n")
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
                            agent   : navigator.userAgent,
                            uid     : ide.userId,
                            creds   : self.auth && auth.getCredentials()[0],
                            loc     : ide.loc,
                            type    : "APF Error",
                            message : e.message,
                            tgt     : e.currentTarget && e.currentTarget.serialize(),
                            url     : e.url,
                            state   : e.state,
                            e       : e.error,
                            log     : apf.console.debugInfo.join("\n")
                        })
                    });
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
                transports:  ["websocket", "htmlfile", "xhr-multipart", "xhr-polling", "jsonp-polling"],
                transportOptions: {
                    "xhr-polling": {
                        timeout: 15000
                    },
                    "jsonp-polling": {
                        timeout: 15000
                    }
                }
            };
            ide.socketConnect = function() {
                clearTimeout(ide.$retryTimer);
                winReconnect.hide();
                stServerConnected.activate();
                ide.dispatchEvent("socketConnect");
            };

            ide.socketDisconnect = function() {
                stProcessRunning.deactivate();
                ide.dispatchEvent("socketDisconnect");

                clearTimeout(ide.$retryTimer);
                var retries = 0;
                ide.$retryTimer = setInterval(function() {
                    if (retries++ == 1)
                        winReconnect.show();
                    ide.socket.connect();
                }, 2000);
            };

            ide.socketMessage = function(message) {
                try {
                    message = JSON.parse(message);
                } catch(e) {
                    return;
                }
                ide.dispatchEvent("socketMessage", {
                    message: message
                });
                if (message.type && message.type == "state") {
                    stProcessRunning.setProperty("active", message.processRunning);
                    if (ide.workspaceDir !== message.workspaceDir) {
                        ide.workspaceDir = message.workspaceDir;
                        ide.dispatchEvent("workspaceDirChange", {
                            workspaceDir: ide.workspaceDir
                        });
                    }
                    var isInit = !ide.davPrefix;
                    ide.davPrefix = message.davPrefix;
                    if (isInit)
                        ide.dispatchEvent("ideready")
                }
            };

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
