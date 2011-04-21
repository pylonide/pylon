var lang = require("pilot/lang");
    
var Workspace = module.exports = function(ide) {
    this.ide = ide;
};

(function() {
    this.createPlugins = function (plugins) {
        var exts = this.exts = {};

        for (var name in plugins) {
            exts[name] = new plugins[name](this.ide, this);
        }
        for (name in exts) {
            if (exts[name].init)
                exts[name].init();
        }
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
    };

    this.getExt = function(name) {
        return this.exts[name] || null;
    };

    this.send = function(msg, replyTo, scope) {
        if (replyTo)
            msg.sid = replyTo.sid;
        this.ide.broadcast(JSON.stringify(msg), scope);
    };

    this.error = function(description, code, message, client) {
        var sid = (message || {}).sid || -1;
        var error = {
            "type": "error",
            "sid": sid,
            "code": code,
            "message": description
        };
        
        if (client)
            client.send(JSON.stringify(error));
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

}).call(Workspace.prototype);
