"use strict";

var nodefs = require("vfs-nodefs-adapter");
var c9util = require("../cloud9.core/util");

/**
 * Run shell commands
 */

var exports = module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];

    pm.addRunner("shell", exports.factory(imports.vfs));

    register(null, {
        "run-shell": {}
    });
};

exports.factory = function(vfs) {
    return function(args, eventEmitter, eventName, callback) {
        var options = {};

        c9util.extend(options, args);
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        options.args = args.args;

        return new Runner(vfs, options, callback);
    };
};

var Runner = exports.Runner = function(vfs, options, callback) {
    this.vfs = vfs;
    this.fs = nodefs(vfs);
    this.uid = options.uid;
    this.command = options.command;
    this.args = options.args || [];
    this.url = options.url;
    this.extra = options.extra;
    this.encoding = options.encoding;

    this.runOptions = {};
    if (options.cwd)
        this.runOptions.cwd = options.cwd;

    if (this.encoding) {
        this.runOptions.stdoutEncoding = this.encoding;
        this.runOptions.stderrEncoding = this.encoding;
    }

    if (options.env)
        this.runOptions.env = options.env;

    this.eventEmitter = options.eventEmitter;
    this.eventName = options.eventName;

    this.pid = 0;

    callback(null, this);
};

(function() {

    this.name = "shell";

    this.exec = function(onStart, onExit) {
        var self = this;
        this.createChild(function(err, child) {
            if (err)
                return onStart(err);

            self.child = child;
            self.pid = child.pid;

            onStart(null, child.pid);

            var out = "";
            var err = "";

            child.on("exit", function(code) {
                onExit(code, out, err);
                self.pid = 0;
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
            self.pid = child.pid;

            self.attachEvents(child);

            callback(null, child.pid);
        });
    };

    this.createChild = function(callback) {
        this.runOptions.args = this.args;
        //console.log(this.command, this.runOptions);
        this.vfs.spawn(this.command, this.runOptions, function(err, meta) {
            callback(err, meta && meta.process);
        });
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
                    "data": data,
                    "extra": self.extra
                });
            };
        }

        child.on("exit", function(code) {
            self.pid = 0;
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

    this.kill = function(signal) {
        this.child && this.child.kill(signal);
    };

    this.describe = function() {
        return {
            command: [this.command].concat(this.args).join(" "),
            type: this.name
        };
    };

}).call(Runner.prototype);
