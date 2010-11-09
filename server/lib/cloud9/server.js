/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var jsDAV = require("jsdav"),
    Async = require("async"),
    fs = require("fs"),
    Path = require("path"),
    Url = require("url");
    

module.exports = IdeServer = function(workspaceDir, server, socketIo, exts) {
    this.workspaceDir = Async.abspath(workspaceDir).replace(/\/+$/, "");
    this.server = server;
    this.davPrefix = "workspace/";

    this.options = {
        workspaceDir: this.workspaceDir,
        davPrefix: this.davPrefix,
        baseurl: "/",
        debug: true
    }

    var _self = this;
    this.socketIo = socketIo;
    this.socketIo.on("connection", function(client) {
        _self.onClientConnection(client);
    });

    this.clients = [];
    this.nodeCmd = process.argv[0];

    this.registerExts(exts);
    
};

(function () {
    
    this.handle = function(req, res, next) {
        var path = Url.parse(req.url).pathname;
        if (path.match(/^\/(?:index.html?)?$/))
            this.serveIndex(req, res, next)
        else if (path.match(/^\/workspace\/?/)) {
		    this.davServer = jsDAV.mount(this.workspaceDir, this.davPrefix, this.server);
            this.davServer.exec(req, res);
        } else
            next();
    };

    this.serveIndex = function(req, res, next) {
	    var self = this;
        fs.readFile(__dirname + "/view/ide.tmpl.html", "utf8", function(err, index) {
	        if (err)
                return next(err);
	           
	        res.writeHead(200, {"Content-Type": "text/html"});
            
            index = index.replace("<%config%>", JSON.stringify({
                davPrefix: self.options.baseurl + "/workspace",
                workspaceDir: self.options.workspaceDir,
                settingsUrl: self.options.baseurl + "/workspace/.settings.xml",
                debug: self.options.debug
            })); 
 
            var settingsPath = self.options.workspaceDir + "/.settings.xml";
            Path.exists(settingsPath, function(exists) {
                if (exists) {
                    fs.readFile(settingsPath, "utf8", function(err, settings) {
                        index = index.replace("<%settings%>", '"' + settings.replace(/"/g, '\\"') + '"');
                        res.end(index);
                    });
                }
                else {
                    index = index.replace("<%settings%>", '""');
                    res.end(index);
                }
            });
	    });
    };

    this.onClientConnection = function(client) {
        var _self = this;
        this.clients[client.sessionId] = client;
        
        client.on("message", function(message) {
            _self.onClientMessage(message, client);
        });

        client.on("disconnect", function() {
            delete _self.clients[client.sessionId];
        });

        this.execHook("connect");
    };

    this.broadcast = function(msg) {
        for (var id in this.clients) 
            this.clients[id].send(msg);
    };

    this.onClientMessage = function(message, client) {
        try {
            message = JSON.parse(message);
        } catch (e) {
            return this.error("Error parsing message: " + e + "\nmessage: " + message, 8);
        }

        this.execHook("command", message, client);
    };

    this.registerExts = function(exts) {
        this.exts = {}
        for (var ext in exts)
            this.exts[ext] = new exts[ext](this);
        for (ext in this.exts) {
            if (this.exts[ext].init)
                this.exts[ext].init();
        }
    }

    this.getExt = function(name) {
       return this.exts[name] || null;
    };

    this.execHook = function() {
        var ext, hooks,
            args = Array.prototype.slice.call(arguments),
            hook = args.shift().toLowerCase().replace(/^[\s]+/, "").replace(/[\s]+$/, "");
        for (var name in this.exts) {
            ext   = this.exts[name];
            hooks = ext.getHooks();
            if (hooks.indexOf(hook) > -1 && ext[hook].apply(ext, args) === true)
                return;
        }
        // if we get here, no hook function was successfully delegated to an
        // extension.
        this.error("Error: no handler found for hook '" + hook + "'. Arguments: "
            + JSON.stringify(args), 9, args[0]);
    };

    this.error = function(description, code, message) {
        console.log("Socket error: " + description, new Error().stack);
        var sid = (message || {}).sid || -1;
        var error = {
            "type": "error",
            "sid": sid,
            "code": code,
            "message": description
        };
        this.broadcast(JSON.stringify(error));
    };
}).call(IdeServer.prototype);