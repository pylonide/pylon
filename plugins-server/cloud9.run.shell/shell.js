"use strict";

var spawn = require("child_process").spawn;
var killTree = require("./killtree").killTree;

/**
 * Run shell commands
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    pm.addRunner("shell", exports.factory(imports.sandbox.getUnixId()));

    register(null, {
        "run-shell": {}
    });
};

exports.factory = function(uid) {
    return function(args, eventEmitter, eventName) {
        return new Runner(uid, args.command, args.args, args.cwd, args.env, eventEmitter, eventName);
    };
};

var Runner = exports.Runner = function(uid, command, args, cwd, env, eventEmitter, eventName) {
    this.uid = uid;
    this.command = command;
    this.args = args || [];

    this.runOptions = {};
    if (cwd)
        this.runOptions.cwd = cwd;

    env = env || {};
    env = env;
    for (var key in process.env)
        if (!env.hasOwnProperty(key))
            env[key] = process.env[key];

    this.runOptions.env = env;

    this.eventEmitter = eventEmitter;
    this.eventName = eventName;

    this.child = {
        pid: null
    };

    var self = this;
    this.__defineGetter__("pid", function(){
        return (self.child.exitCode === null && self.child.signalCode === null)  ? self.child.pid : 0;
    });
};

(function() {

    this.name = "shell";

    this.exec = function(onStart, onExit) {
        var self = this;
        this.createChild(function(err, child) {
            if (err)
                return onStart(err);

            self.child = child;
            onStart(null, child.pid);

            var out = "";
            var err = "";

            child.on("exit", function(code) {
                onExit(code, out, err);
            });

            child.stdout.on("data", function (data) {
                out += data.toString("utf8");
            });

            child.stderr.on("data", function (data) {
                err += data.toString("utf8");
            });
        });
    };

    this.spawn = function(callback) {
        var self = this;
        this.createChild(function(err, child) {
            if (err)
                return callback(err);

            self.child = child;
            self.attachEvents(child);

            callback(null, child.pid);
        });
    };

    this.createChild = function(callback) {
        if (this.uid) {
            this.args = ["-Hu", "#" + this.uid, this.command].concat(this.args);
            this.command = "sudo";
        }

        try {
            // console.log(this.command, this.args)
            var child = spawn(this.command, this.args, this.runOptions);
        } catch (e) {
            return callback(e);
        }
        callback(null, child);
    };

    this.attachEvents = function(child) {
        var self = this;
        var pid = child.pid;

        child.stdout.on("data", sender("stdout"));
        child.stderr.on("data", sender("stderr"));

        function emit(msg) {
            // console.log(self.eventName, msg);
            self.eventEmitter.emit(self.eventName, msg);
        }

        function sender(stream) {
            return function(data) {
                emit({
                    "type": self.name + "-data",
                    "pid": pid,
                    "stream": stream,
                    "data": data.toString("utf8")
                });
            };
        }

        child.on("exit", function(code) {
            emit({
                "type": self.name + "-exit",
                "pid": pid,
                "code": code
            });
        });

        process.nextTick(function() {
            emit({
                "type": self.name + "-start",
                "pid": pid
            });
        });
    };

    this.kill = function() {
        var self = this;
        killTree(this.pid);

        // check after 2sec if the process is really dead
        // If not kill it harder
        setTimeout(function() {
            killTree(self.pid, "SIGKILL");
        }, 2000);
    };

    this.describe = function() {
        return {
            command: [this.command].concat(this.args).join(" "),
            type: this.name
        };
    };

}).call(Runner.prototype);