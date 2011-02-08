/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var jsDAV = require("jsdav"),
    DavPermission = require("./dav/permission"),
    Async = require("async"),
    User = require("./user"),
    fs = require("fs"),
    sys = require("sys"),
    Path = require("path"),
    lang = require("pilot/lang"),
    Url = require("url"),
    template = require("./template"),
    EventEmitter = require("events").EventEmitter;

module.exports = Ide = function(options, httpServer, exts) {
    EventEmitter.call(this);
    
    this.httpServer = httpServer;

    this.workspaceDir = Async.abspath(options.workspaceDir).replace(/\/+$/, "");
    var baseUrl = (options.baseUrl || "").replace(/\/+$/, "");
    this.options = {
        workspaceDir: this.workspaceDir,
        mountDir: options.mountDir || this.workspaceDir,
        davPrefix: options.davPrefix || (baseUrl + "/workspace"),
        baseUrl: baseUrl,
        debug: options.debug === true,
        staticUrl: options.staticUrl || "/static",
        workspaceId: options.workspaceId || "ide",
        settingsFile: options.settingsFile || ".settings.xml",
        db: options.db || null,
        plugins: options.plugins || [
            "ext/filesystem/filesystem",
            "ext/settings/settings",
            "ext/editors/editors",
            "ext/themes/themes",
            "ext/themes_default/themes_default",
            "ext/panels/panels",
            "ext/dockpanel/dockpanel",
            "ext/tree/tree",
            "ext/save/save",
            "ext/gotofile/gotofile",
            "ext/newresource/newresource",
            "ext/undo/undo",
            "ext/clipboard/clipboard",
            "ext/searchinfiles/searchinfiles",
            "ext/searchreplace/searchreplace",
            "ext/quickwatch/quickwatch",
            "ext/quicksearch/quicksearch",
            "ext/gotoline/gotoline",
            "ext/html/html",
            "ext/browser/browser",
            "ext/code/code",
            "ext/extmgr/extmgr",
            "ext/run/run", //Add location rule
            "ext/debugger/debugger", //Add location rule
            "ext/noderunner/noderunner", //Add location rule
            "ext/console/console",
            "ext/tabbehaviors/tabbehaviors",
            "ext/keybindings/keybindings",
            "ext/watcher/watcher",
            "ext/collaborate/collaborate",
            "ext/todo/todo"
        ]
    };

    this.$users = {};
    this.nodeCmd = process.argv[0];

    this.registerExts(exts);
};

sys.inherits(Ide, EventEmitter);

(function () {
    
    this.handle = function(req, res, next) {
        var path = Url.parse(req.url).pathname;
        
        this.indexRe = this.indexRe || new RegExp("^" + lang.escapeRegExp(this.options.baseUrl) + "(?:\\/(?:index.html?)?)?$");
        this.workspaceRe = this.workspaceRe || new RegExp("^" + lang.escapeRegExp(this.options.davPrefix) + "(\\/|$)");
        
        if (path.match(this.indexRe)) {
            if (req.method !== "GET")
                return next();
            this.$serveIndex(req, res, next);
        }
        else if (path.match(this.workspaceRe)) {
            if (!this.davServer) {
                this.davServer = jsDAV.mount(this.options.mountDir, this.options.davPrefix, this.httpServer, false);
                
                this.davServer.plugins["permission"] = DavPermission;
                this.emit("configureDav", this.davServer);
            }
            this.davServer.permissions = this.getPermissions(req);
            this.davServer.exec(req, res);
        } else {
            next();
        }
    };

    this.$serveIndex = function(req, res, next) {
        var self = this;
        fs.readFile(__dirname + "/view/ide.tmpl.html", "utf8", function(err, index) {
            if (err)
                return next(err);
               
            res.writeHead(200, {"Content-Type": "text/html"});
            
            var permissions = self.getPermissions(req);
            var plugins = lang.arrayToMap(self.options.plugins);

            var client_exclude = lang.arrayToMap(permissions.client_exclude.split("|"));
            for (plugin in client_exclude)
                delete plugins[plugin];
                
            var client_include = lang.arrayToMap((permissions.client_include || "").split("|"));
            for (plugin in client_include)
                if (plugin)
                    plugins[plugin] = 1;
            
            plugins = Object.keys(plugins);
            
            var replacements = {
                davPrefix: self.options.davPrefix,
                workspaceDir: self.options.workspaceDir,
                settingsUrl: self.options.baseUrl + "/workspace/" + self.options.settingsFile,
                debug: self.options.debug,
                staticUrl: self.options.staticUrl,
                sessionId: req.sessionID, // set by connect
                workspaceId: self.options.workspaceId,
                plugins: plugins,
                readonly: (permissions.dav !== "rw")
            };

            var settingsPath = self.options.workspaceDir + "/" + self.options.settingsFile;
            Path.exists(settingsPath, function(exists) {
                if (exists) {
                    fs.readFile(settingsPath, "utf8", function(err, settings) {
                        replacements.settingsXml = settings;
                        index = template.fill(index, replacements);
                        res.end(index);
                    });
                }
                else {
                    index = template.fill(index, replacements);
                    res.end(index);
                }
            });
        });
    };

    this.addUser = function(username, permissions) {
        var user = this.$users[username];
        if (user) {
            user.setPermissions(permissions);
        }
        else {
            user = this.$users[username] = new User(username, permissions);
            
            var _self = this;
            user.on("message", function(msg) {
                _self.onUserMessage(msg.user, msg.message, msg.client);
            });
            user.on("disconnectClient", function(msg) {
                _self.execHook("disconnect", msg.user, msg.client);
            });
            user.on("disconnectUser", function(user) {
                // TODO delay removal (use timeout)
                delete _self.$users[user.name];
                _self.onUserCountChange(Object.keys(_self.$users).length);
            });
            
            this.onUserCountChange();
        }
    };
    
    this.getPermissions = function(req) {
        var username = req.session.username;
        if (!username || !this.$users[username])
            return User.VISITOR_PERMISSIONS
        else
            return this.$users[username].getPermissions();
    };
    
    this.hasUser = function(username) {
        return !!this.$users[username];
    };

    this.addClientConnection = function(username, client, message) {
        var user = this.$users[username];
        if (!user)
            return this.error("No session for user " + username, 99, message, client);

        user.addClientConnection(client, message);
    };
    
    this.onUserMessage = function(user, message, client) {
//        console.log(message);
        this.execHook("command", user, message, client);
    };
    
    this.onUserCountChange = function() {
        this.emit("userCountChange", Object.keys(this.$users).length);
        
        // TODO remove
        this.emit("clientCountChange", Object.keys(this.$users).length);
    };

    this.broadcast = function(msg, scope) {
        // TODO check permissions
        for (var username in this.$users) {
            var user = this.$users[username];            
            user.broadcast(msg, scope);
        }
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

    this.execHook = function(hook, user /* varargs */) {
        var ext, hooks,
            args = Array.prototype.slice.call(arguments, 1),
            hook = hook.toLowerCase().replace(/^[\s]+/, "").replace(/[\s]+$/, "");

        var server_exclude = lang.arrayToMap(user.getPermissions().server_exclude.split("|"));
        for (var name in this.exts) {
            if (server_exclude[name]) {
                return;
            }
            ext   = this.exts[name];
            hooks = ext.getHooks();            
            if (hooks.indexOf(hook) > -1 && ext[hook].apply(ext, args) === true)
                return;
        }
        // if we get here, no hook function was successfully delegated to an
        // extension.

        //this.error("Error: no handler found for hook '" + hook + "'. Arguments: "
        //    + sys.inspect(args), 9, args[0]);
    };

    // TODO remove
    this.error = function(description, code, message, client) {
        //console.log("Socket error: " + description, new Error().stack);
        var sid = (message || {}).sid || -1;
        var error = JSON.stringify({
            "type": "error",
            "sid": sid,
            "code": code,
            "message": description
        });
        if (client)
            client.send(error)
        else
            this.broadcast(error);
    };
    
    this.dispose = function(callback) {
        var count;
        for (var name in this.exts) {
            count++;
            var ext = this.exts[name];
            ext.dispose(function() {
                count--;
                if (count == 0)
                    callback();
            });
        }
    };
}).call(Ide.prototype);
