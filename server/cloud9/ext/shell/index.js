/**
 * Shell Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin"),
    Fs     = require("fs"),
    Path   = require("path"),
    Async  = require("async"),
    sys    = require("sys");

var ShellPlugin = module.exports = function(ide) {
    this.ide = ide;
    this.hooks = ["command"];
    this.name = "shell";
}

sys.inherits(ShellPlugin, Plugin);

(function() {
    this.command = function(user, message, client) {
        if (!this[message.command])
            return false;

        this[message.command](message);

        return true;
    };

    this["internal-autocomplete"] = function(message) {
        var argv  = [].concat(message.argv),
            cmd   = argv.shift(),
            _self = this;
        this.getListing(argv.pop(), message.cwd, (cmd == "cd" || cmd == "ls"), function(tail, matches) {
            _self.sendResult(0, "internal-autocomplete", {
                matches: matches,
                line   : message.line,
                base   : tail,
                cursor : message.cursor,
                textbox: message.textbox,
                argv   : message.argv
            });
        });
    };

    this["internal-isfile"] = function(message) {
        var file  = message.argv.pop(),
            path  = message.cwd || this.ide.workspaceDir,
            _self = this;
        path = Path.normalize(path + "/" + file.replace(/^\//g, ""));

        if (path.indexOf(this.ide.workspaceDir) === -1) {
            this.sendResult();
            return;
        }
        Fs.stat(path, function(err, stat) {
            if (err) {
                return _self.sendResult(0, "error",
                    err.toString().replace("Error: ENOENT, ", ""));
            }
            _self.sendResult(0, "internal-isfile", {
                cwd: path,
                isfile: (stat && !stat.isDirectory()),
                sender: message.sender || "shell"
            });
        });
    };

    this.commandhints = function(message) {
        var commands = {},
            _self    = this;

        Async.list(Object.keys(this.ide.exts))
             .each(function(sName, next) {
                 var oExt = _self.ide.getExt(sName);
                 if (oExt["$commandHints"]) {
                     oExt["$commandHints"](commands, message, next);
                 }
                 else {
                     if (!oExt.metadata) {
                         Fs.readFile(Path.normalize(__dirname + "/../" + sName + "/package.json"), function(err, data) {
                             if (err)
                                 return next();
                             var o = JSON.parse(data);
                             oExt.metadata = o;
                             afterMeta();
                         });
                     }
                     else {
                         afterMeta();
                     }

                     function afterMeta() {
                         if (oExt.metadata && oExt.metadata.commands)
                             _self.extend(commands, oExt.metadata.commands);
                         next();
                     }
                 }
             })
             .end(function() {
                 _self.sendResult(0, message.command, commands)
             });
    };

    this.pwd =
    this.ls  = function(message) {
        var _self = this;
        this.spawnCommand(message.command, message.argv.slice(1), message.cwd, null, null, function(code, err, out) {
            _self.sendResult(0, message.command, {
                code: code,
                argv: message.argv,
                err: err,
                out: out
            });
        });
    };

    this.cd = function(message) {
        var to    = message.argv.pop(),
            path  = message.cwd || this.ide.workspaceDir,
            _self = this;
        if (to != "/") {
            path = Path.normalize(path + "/" + to.replace(/^\//g, ""));
            if (path.indexOf(this.ide.workspaceDir) === -1)
                return this.sendResult();
            Fs.stat(path, function(err, stat) {
                if (err) {
                    return _self.sendResult(0, "error",
                        err.toString().replace("Error: ENOENT, ", ""));
                }
                if (!stat.isDirectory())
                    return _self.sendResult(0, "error", "Not a directory.");
                _self.sendResult(0, message.command, {cwd: path});
            });
        }
    };

    this.mkdir = function(message) {
        var _self = this;
        this.spawnCommand(message.command, message.argv.slice(1), message.cwd, null, null, function(code, err, out) {
            _self.sendResult(0, message.command, {
                code    : code,
                argv    : message.argv,
                err     : err,
                out     : out
            });
        });
    };

    this.getListing = function(tail, path, dirmode, callback) {
        var matches = [];
        tail    = (tail || "").replace(/^[\s]+/g, "").replace(/[\s]+$/g, "").split(/[\s]+/g).pop();
        if (tail.indexOf("/") > -1) {
            path = path.replace(/[\/]+$/, "") + "/" + tail.substr(0, tail.lastIndexOf("/")).replace(/^[\/]+/, "");
            tail = tail.substr(tail.lastIndexOf("/") + 1).replace(/^[\/]+/, "").replace(/[\/]+$/, "");
        }
        Async.readdir(path).stat().each(function(file, next) {
            if (file.name.indexOf(tail) === 0 && (!dirmode || file.stat.isDirectory()))
                matches.push(file.name + (file.stat.isDirectory() ? "/" : ""));
            next();
        })
        .end(function() {
            callback(tail, matches);
        });
    };
    
    this.dispose = function(callback) {
        // TODO kill all running processes!
        callback();
    }
}).call(ShellPlugin.prototype);
