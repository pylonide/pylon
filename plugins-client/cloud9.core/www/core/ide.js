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
    var SMITH_IO = require("smith.io");

    ide = new apf.Class().$init();

    ide.createDocument = function(node, value){
        return new Document(node, value);
    };

    ide.start = function() {
        this.workspaceDir   = window.cloud9config.workspaceDir.replace(/\/+$/, "");
        this.davPrefix      = window.cloud9config.davPrefix.replace(/\/+$/, "");
        this.workerPrefix   = window.cloud9config.workerUrl;
        this.staticPrefix   = window.cloud9config.staticUrl;
        this.sessionId      = window.cloud9config.sessionId;
        this.workspaceId    = window.cloud9config.workspaceId;
        this.readonly       = window.cloud9config.readonly;
        this.projectName    = window.cloud9config.projectName;
        this.uid            = window.cloud9config.uid;
        this.pid            = window.cloud9config.pid;
        this.env            = window.cloud9config.env;
        this.local          = window.cloud9config.local;
        this.apiPrefix      = this.davPrefix.replace(/workspace/, "api");

        this.loggedIn       = parseInt(this.uid, 10) > 0;

        this.onLine         = false;
        this.offlineFileSystemSupport = false;

        this.dispatchEvent("load");

       var loc = location.href;
        if (
            location.protocol !== "file:"
            && loc.indexOf("dev") === -1
            && (loc.indexOf("c9.io") > -1))
        {
            var oldOnError = window.onerror;
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
                if (oldOnError)
                    oldOnError.apply(this, arguments);
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

    // fire up the socket connection:
    if (window.cloud9config.debug)
        console.info("Connecting", JSON.parse(window.cloud9config.smithIo));

    SMITH_IO.connect(JSON.parse(window.cloud9config.smithIo), function(err, connection) {
        if (err)
            return console.error(err);

        ide.connection = connection;

        connection.on("connect", function() {
            if (window.cloud9config.debug)
                console.info("Connected");

            ide.connecting = true;
            // send over the internal method, otherwise it'll be queued
            // because we aren't fully attached to the server yet
            connection.send({
                command: "attach",
                sessionId: ide.sessionId,
                workspaceId: ide.workspaceId
            });
        });
        connection.on("disconnect", function(reason) {
            if (window.cloud9config.debug)
                console.info("Disconnected");

            ide.connected = false;
            ide.dispatchEvent("socketDisconnect");
        });

        connection.on("message", function(message) {
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
                ide.connecting = false;
                ide.connected = true;
                ide.dispatchEvent("socketConnect");
            }

            if (message.type === "error") {
                // TODO: Don't display all errors?
                if (ide.dispatchEvent("showerrormessage", message) !== false) {
                    util.alert(
                        "Error on server",
                        "Received following error from server:",
                        JSON.stringify(message.message)
                    );
                }
            }

            ide.dispatchEvent("socketMessage", {
                message: message
            });
        });

        connection.on("away", function() {
            if (window.cloud9config.debug) console.info("Away");
        });
        connection.on("back", function() {
            if (window.cloud9config.debug) console.info("Back");
        });

    });

    this.inited = true;

    ide.send = function(msg) {
        // if we're already connected, then do an action
        if (ide.connected === true) {
            ide.connection.send(msg);
        }
        else {
            // otherwise execute when we're done
            ide.addEventListener("socketConnect", function onConnect() {
                ide.removeEventListener("socketConnect", onConnect);
                ide.connection.send(msg);
            });
        }
    };

    ide.getActivePage = function() {
        return this.dispatchEvent("correctactivepage") || tabEditors.getPage() || null;
    };

    ide.getActivePageModel = function() {
        var page = this.getActivePage();
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
