"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var spawn = require("child_process").spawn;
var killTree = require("./killtree").killTree;

/**
 * Run shell commands
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];

    imports.sandbox.getUnixId(function(err, unixId) {
        if (err) return register(err);

        pm.addRunner("shell", exports.factory(unixId));

        register(null, {
            "run-shell": {}
        });
    });
};

exports.factory = function(uid) {
    return function(args, eventEmitter, eventName, callback) {
        var options = {};
        c9util.extend(options, args);
        options.uid = uid;
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        options.args = args.args;

        return new Runner(options, callback);
    };
};

var Runner = exports.Runner = function(options, callback) {
    this.uid = options.uid;
    this.command = options.command;
    this.args = options.args || [];
    this.extra = options.extra;

    this.runOptions = {};
    if (options.cwd)
        this.runOptions.cwd = options.cwd;

    this.env = options.env || {};
    for (var key in process.env)
        if (!this.env.hasOwnProperty(key))
            this.env[key] = process.env[key];

    this.runOptions.env = this.env;

    this.eventEmitter = options.eventEmitter;
    this.eventName = options.eventName;

    this.child = {
        pid: null
    };

    var self = this;
    this.__defineGetter__("pid", function(){
        return (self.child.exitCode === null && self.child.signalCode === null)  ? self.child.pid : 0;
    });
    
    callback(null, self);
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
            self.eventEmitter.emit(self.eventName, msg);
        }

        function sender(stream) {
            return function(data) {
                emit({
                    "type": self.name + "-data",
                    "pid": pid,
                    "stream": stream,
                    "data": data.toString("utf8"),
                    "extra": self.extra
                });
            };
        }

        child.on("exit", function(code) {
            emit({
                "type": self.name + "-exit",
                "pid": pid,
                "code": code,
                "extra": self.extra
            });
        });

        process.nextTick(function() {
            emit({
                "type": self.name + "-start",
                "pid": pid,
                "extra": self.extra
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
