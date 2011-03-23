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

module.exports = Ide = function(options, httpServer, exts, socket) {
    EventEmitter.call(this);
    
    this.httpServer = httpServer;
    this.socket = socket;

    this.workspaceDir = Async.abspath(options.workspaceDir).replace(/\/+$/, "");
    var baseUrl = (options.baseUrl || "").replace(/\/+$/, "");
    var staticUrl = options.staticUrl || "/static";
    var requirejsConfig = options.requirejsConfig || {
        paths: {
            "pilot": staticUrl + "/support/ace/support/pilot/lib/pilot",
            "ace": staticUrl + "/support/ace/lib/ace",
            "debug": staticUrl + "/support/lib-v8debug/lib/v8debug",
            "apf": staticUrl + "/support/apf"
        },
        waitSeconds: 30
    };
    
    this.options = {
        workspaceDir: this.workspaceDir,
        mountDir: options.mountDir || this.workspaceDir,
        davPrefix: options.davPrefix || (baseUrl + "/workspace"),
        baseUrl: baseUrl,
        debug: options.debug === true,
        staticUrl: staticUrl,
        workspaceId: options.workspaceId || "ide",
        context: options.context || null,
        db: options.db || null,
        plugins: options.plugins || Ide.DEFAULT_PLUGINS,
        requirejsConfig: requirejsConfig,
        offlineManifest: options.offlineManifest || "",
        projectName: options.projectName || this.workspaceDir.split("/").pop(),
        version: options.version
    };

    this.$users = {};

    this.nodeCmd = process.argv[0];

    this.davServer = jsDAV.mount(this.options.mountDir, this.options.davPrefix, this.httpServer, false);
    this.davInited = false;
    
    this.registerExts(exts);
};

sys.inherits(Ide, EventEmitter);

Ide.DEFAULT_PLUGINS = [
    "ext/filesystem/filesystem",
    "ext/settings/settings",
    "ext/editors/editors",
    "ext/connect/connect",
    "ext/themes/themes",
    "ext/themes_default/themes_default",
    "ext/panels/panels",
    "ext/dockpanel/dockpanel",
    "ext/openfiles/openfiles",
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
    "ext/dragdrop/dragdrop"
];

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
            if (!this.davInited) {
                if(process.platform == "sunos"){
                    this.davServer.plugins["codesearch"].GREP_CMD = __dirname+"/../../support/gnu-builds/grep-sunos";
                    this.davServer.plugins["filesearch"].FIND_CMD = __dirname+"/../../support/gnu-builds/find-sunos";
                }
                this.davServer.plugins["permission"] = DavPermission;
                this.davInited = true;
                this.emit("configureDav", this.davServer);
            }
            this.davServer.permissions = this.getPermissions(req);
            this.davServer.exec(req, res);
        } else {
            next();
        }
    };

    this.$serveIndex = function(req, res, next) {
        var _self = this;
        fs.readFile(__dirname + "/view/ide.tmpl.html", "utf8", function(err, index) {
            if (err)
                return next(err);
               
            res.writeHead(200, {"Content-Type": "text/html"});
            
            var permissions = _self.getPermissions(req);
            var plugins = lang.arrayToMap(_self.options.plugins);

            var client_exclude = lang.arrayToMap(permissions.client_exclude.split("|"));
            for (plugin in client_exclude)
                delete plugins[plugin];
                
            var client_include = lang.arrayToMap((permissions.client_include || "").split("|"));
            for (plugin in client_include)
                if (plugin)
                    plugins[plugin] = 1;
            
            var staticUrl = _self.options.staticUrl;
            var aceScripts = 
                '<script type="text/javascript" src="' + staticUrl + '/support/ace/build/src/ace-uncompressed.js"></script>\n' +
                '<script type="text/javascript" src="' + staticUrl + '/support/ace/build/src/mode-javascript.js"></script>'
            
            var replacements = {
                davPrefix: _self.options.davPrefix,
                workspaceDir: _self.options.workspaceDir,
                debug: _self.options.debug,
                staticUrl: staticUrl,
                sessionId: req.sessionID, // set by connect
                workspaceId: _self.options.workspaceId,
                plugins: Object.keys(plugins),
                readonly: (permissions.dav !== "rw"),
                requirejsConfig: _self.options.requirejsConfig,
                settingsXml: "",
                offlineManifest: _self.options.offlineManifest,
                scripts: _self.options.debug ? "" : aceScripts,
                projectName: _self.options.projectName,
                version: _self.options.version
            };

            var settingsPlugin = _self.getExt("settings");
            var user = _self.getUser(req);
            if (!settingsPlugin || !user) {
                index = template.fill(index, replacements);
                res.end(index);
            } else {
                settingsPlugin.loadSettings(user, function(err, settings) {
                    replacements.settingsXml = err ? "" : settings;
                    index = template.fill(index, replacements);
                    res.end(index);
                });
            }
        });
    };

    this.addUser = function(username, permissions, userData) {
        var user = this.$users[username];
        if (user) {
            user.setPermissions(permissions);
        }
        else {
            user = this.$users[username] = new User(username, permissions, userData);
            
            var _self = this;
            user.on("message", function(msg) {
                if(_self.$users[msg.user.uid]) {
                    _self.$users[msg.user.uid].last_message_time = new Date().getTime();
                }
                _self.onUserMessage(msg.user, msg.message, msg.client);
            });
            user.on("disconnectClient", function(msg) {
                _self.execHook("disconnect", msg.user, msg.client);
            });
            user.on("disconnectUser", function(user) {
                console.log("Running user disconnect timer...");

                setTimeout(function() {
                    var now = new Date().getTime();
                    if((now - user.last_message_time) > 19000) {
                        delete _self.$users[user.uid];
                        _self.onUserCountChange(Object.keys(_self.$users).length);
                        _self.emit("userLeave", user);
                    }
                }, 20000);
            });
            
            this.onUserCountChange();
            this.emit("userJoin", user);
        }
    };
    
    this.getUser = function(req) {
        var uid = req.session.uid;
        if (!uid || !this.$users[uid])
            return null;
        else
            return this.$users[uid];
    };
    
    this.getPermissions = function(req) {
        var user = this.getUser(req);
        if (!user)
            return User.VISITOR_PERMISSIONS;
        else
            return user.getPermissions();
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
    
    this.sendToUser = function(username, msg) {
        this.$users[username] && this.$users[username].broadcast(msg);
    }

    this.registerExts = function(exts) {
        this.exts = {}

        for (var ext in exts) {
            this.exts[ext] = new exts[ext](this);
        }
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
                continue;
            }

            ext   = this.exts[name];
            hooks = ext.getHooks();
            if (hooks.indexOf(hook) > -1 && ext[hook].apply(ext, args) === true) {
                return;
            }
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

