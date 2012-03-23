var util  = require("./util");
var fs    = require("fs");
var Path  = require("path");
var Spawn = require("child_process").spawn;

var Workspace = module.exports = function(config) {
    if (config)
        for (var prop in config)
            this[prop] = config[prop];
    else
        throw new Error("No parameters were passed to Workspace.");

    this.init();
};

(function() {
    this.init = function() {
        this.workspaceId  = this.ide.options.workspaceId;
        this.workspaceDir = this.ide.options.workspaceDir;
    };

    this.createPlugins = function (plugins) {
        this.plugins = {};

        for (var name in plugins) {
            this.plugins[name] = new plugins[name](this.ide, this);
        }

        for (var name in plugins) {
            if (this.plugins[name].init)
                this.plugins[name].init();
        }
    };

    this.getServerExclude = function(user) {
        return util.arrayToMap(user.getPermissions().server_exclude.split("|"));
    };

    this.execHook = function(hook, user /* varargs */) {
        var args = Array.prototype.slice.call(arguments, 1);
        hook = hook.toLowerCase().trim();

        var server_exclude = this.getServerExclude(user);

        for (var name in this.plugins) {
            if (server_exclude[name]) continue;

            var plugin = this.plugins[name];
            var hooks = plugin.getHooks();
            if (hooks.indexOf(hook) > -1 && plugin[hook].apply(plugin, args) === true) {
                return;
            }
        }

        // If a message is sent with the requireshandling flag
        // then the client wants to be notified via an error that there was
        // no plugin suitable to handle this command
        var message = args.length > 1 && args[1];
        var self = this;
        if (message && message.requireshandling === true) {
            this.searchForModuleHook(message.command, function(found, filePath) {
                if (found) {
                    self.executeModuleHook(filePath, message);
                }
                else {
                    self.send({
                        type: "result",
                        subtype: "info",
                        body:  "Command '" + message.command + "' was not recognized"
                    }, message);
                }
            });
        }
    };

    this.searchForModuleHook = function(command, cb) {
        var baseDir = this.ide.workspaceDir + "/node_modules";

        function searchModules(dirs, it) {
            if (!dirs[it])
                return cb(false);

            var currentDir = baseDir + "/" + dirs[it];
            fs.readFile(currentDir + "/package.json", "utf-8", function(err, file) {
                if (err)
                    return searchModules(dirs, it+1);

                try {
                    file = JSON.parse(file);
                }
                catch (ex) {
                    return searchModules(dirs, it+1);
                }

                if (!file.bin)
                    return searchModules(dirs, it+1);

                for (var binIdent in file.bin) {
                    if (binIdent === command)
                        return cb(true, currentDir + "/" + file.bin[binIdent]);
                }

                searchModules(dirs, it+1);
            });
        }

        fs.readdir(baseDir, function(err, res) {
            if (err)
                return cb(false);

            searchModules(res, 0);
        });
    };

    this.executeModuleHook = function(filePath, message) {
        message.file = filePath;

        var self = this;

        if (this.child)
            return this.error("Child process already running!", 1, message);

        Path.exists(filePath, function(exists) {
           if (!exists)
               return self.error("File does not exist in module bin: " + filePath, 2, message);

            Path.exists(message.cwd, function(exists) {
               if (!exists)
                   return self.error("cwd does not exist: " + message.cwd, 3, message);

                var args = (message.preArgs || []).concat(filePath).concat(message.args || []);
                self.$runProc(self.ide.nodeCmd, message, args, message.cwd, {}, false);
            });
        });
    };

    this.$runProc = function(proc, message, args, cwd, env) {
        var self = this;

        // mixin process env
        for (var key in process.env) {
            if (!(key in env))
                env[key] = process.env[key];
        }

        console.log("Executing node " + proc + " " + args.join(" ") + " " + cwd);

        var child = this.child = Spawn(proc, args, {cwd: cwd, env: env});

        child.stdout.on("data", sender("stdout"));
        child.stderr.on("data", sender("stderr"));

        function sender(stream) {
            return function(data) {
                var outmsg = {
                    type   : "result",
                    subtype: message.command,
                    sid    : 0,
                    body   : {
                        code: 0,
                        argv: message.argv,
                        err: "",
                        out: data.toString("utf8")
                    }
                };

                self.ide.broadcast(JSON.stringify(outmsg), self.name);
            };
        }

        child.on("exit", function() {
            self.$procExit();
        });

        return child;
    };

    this.$procExit = function() {
        delete this.child;
    };

    this.getExt = function(name) {
        return this.plugins[name] || null;
    };

    this.send = function(msg, replyTo, scope) {
        if (replyTo)
            msg.sid = replyTo.sid;
        this.ide.broadcast(JSON.stringify(msg), scope);
    };

    this.sendError = function(error, client) {
        if (client)
            client.send(JSON.stringify(error));
        else
            this.ide.broadcast(error);
    };

    this.error = function(description, code, message, client) {
        var sid = (message || {}).sid || -1;
        var error = {
            "type": "error",
            "sid": sid,
            "code": code,
            "message": description
        };

        this.sendError(error, client || null);
    };

    this.dispose = function(callback) {
        var count;
        for (var name in this.plugins) {
            count += 1;
            this.plugins[name].dispose(function() {
                count -= 1;
                if (count === 0)
                    callback();
            });
        }

        //this.ide.davServer.unmount();
    };

}).call(Workspace.prototype);
