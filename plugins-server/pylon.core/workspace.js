var util = require("./util");

var Workspace = module.exports = function(ide) {
    this.ide = ide;
    this.workspaceId = ide.options.workspaceId;
    this.workspaceDir = ide.options.workspaceDir;
};

(function() {

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
        var serverExclude = "";
        // We assume `user` has been passed. Otherwise it is fine to throw.
        if (!user.permissions) {
            console.error("Error: Couldn't retrieve permissions for user ", user);
            console.trace();
        }
        else {
            serverExclude = user.permissions.server_exclude;
        }

        return util.arrayToMap(serverExclude.split("|"));
    };

    this.execHook = function(hook, user /* varargs */) {
        var self = this;
        var args = Array.prototype.slice.call(arguments, 1);
        hook = hook.toLowerCase().trim();

        var server_exclude = this.getServerExclude(user);

        for (var name in this.plugins) {
            if (server_exclude[name])
                continue;

            var plugin = this.plugins[name];
            var hooks = plugin.getHooks();
            if (hooks.indexOf(hook) > -1 && plugin[hook].apply(plugin, args) === true) {
                return;
            }
        }

        // If a message is sent with the requireshandling flag then the client
        // wants to be notified via an error that there was no plugin found to
        // handle this command
        var message = args.length > 1 && args[1];
        if (!message || message.requireshandling !== true)
            return;

        var sendCommandNotFound = function(err) {
            self.send({
                type: "result",
                subtype: "info",
                body: err || "Command '" + message.command + "' was not recognized",
                extra: message.extra
            }, message);
        };

        if (this.plugins["npm-runtime"]) {
            this.plugins["npm-runtime"].searchAndRunModuleHook(message, user, function(err, found) {
                if (err || !found)
                    sendCommandNotFound(err);
            });
        }
        else {
            sendCommandNotFound();
        }
    };

    this.getExt = function(name) {
        if (!this.plugins || !this.plugins[name])
            return null
        return this.plugins[name];
    };

    this.send = function(msg, replyTo, scope) {
        if (msg && replyTo)
            msg.sid = replyTo.sid;
        this.ide.broadcast(msg, scope);
    };

    this.sendError = function(error, client) {
        if (client)
            client.send(error);
        else
            this.ide.broadcast(error);
    };

    this.error = function(description, code, message, client) {
        var sid = (message || {}).sid || -1;
        var error = {
            "type": "error",
            "sid": sid,
            "code": code,
            "message": (typeof description === "object" && description.message) ? description.message : description
        };

        if (typeof description === "object" && description.stack) {
            console.error(description.stack);
        }

        this.sendError(error, client || null);
    };

    this.canShutdown = function() {
        var plugins = this.plugins;
        if (!plugins)
            return true;

        return Object.keys(plugins).every(function(name) {
            return plugins[name].canShutdown();
        });
    };

    this.dispose = function(callback) {
        var count = 0;
        var disposeFn = function() {
            process.nextTick(function() {
                count -= 1;
                if (count === 0)
                    callback && callback();
            });
        };

        for (var name in this.plugins) {
            count += 1;
            this.plugins[name].dispose(disposeFn);
        }
    };

}).call(Workspace.prototype);
