"use strict";

/**
 * Process Manager
 *
 * manages all running subprocesses like git, npm and node and all debug sessions
 *
 * @param runners {Map} maps runner ids to runner factories
 */

var async = require("asyncjs");

var ProcessManager = module.exports = function(runners, eventEmitter) {
    this.runners = runners;
    this.eventEmitter = eventEmitter;

    this.processes = {};
};

(function() {

    this.destroy = function() {
        this.disposed = true;
        clearInterval(this.shutDownInterval);

        var ps = this.ps();
        Object.keys(ps).forEach(this.kill.bind(this));
    };

    this.prepareShutdown = function(callback) {
        var self = this;
        var processCount;

        console.log(this.workspaceId + ": Waiting for child process to finish.");

        // wait for all child processes to finish
        this.shutDownInterval = setInterval(function() {
            processCount = Object.keys(self.ps()).length;

            if (!processCount)
                return callback();
        }, 100);
    };

    this.spawn = function(runnerId, options, eventName, callback) {
        if (this.disposed)
            return callback("cannot run script - the process manager has already been disposed");

        var self = this;
        var runnerFactory = this.runners[runnerId];
        if (!runnerFactory)
            return callback("Could not find runner with ID " + runnerId);

        runnerFactory(options, this.eventEmitter, eventName, function (err, child) {
            if (err)
                return callback(err);

            child.spawn(function(err) {
                if (err)
                    return callback(err);

                self.processes[child.pid] = child;
                callback(null, child.pid, child);
            });
        });
    };

    /**
     * execute process and wait for completion. stdout and stderr are returned
     * in the callback.
     */
    this.exec = function(runnerId, options, onStart, onExit) {
        if (this.disposed)
            return onStart("cannot run script - the process manager has already been disposed");

        var self = this;

        var runnerFactory = this.runners[runnerId];
        if (!runnerFactory)
            return onStart("Could not find runner with ID " + runnerId);

        runnerFactory(options, this.eventEmitter, "", function (err, child) {
            if (err)
                return onStart(err);

            child.exec(function(err, pid) {
                if (err)
                    return onStart(err);

                self.processes[child.pid] = child;
                onStart(null, child.pid);

            }, onExit);
        });
    };

    this.execCommands = function(runnerId, cmds, callback) {
        var _self = this;
        var out = "";
        var err = "";
        async.list(cmds)
            .each(function(cmd, next) {
                //console.log("CMD", cmd)
                _self.exec(
                    runnerId, cmd,
                    function(err, pid) {
                        if (err)
                            next(err);
                    },
                    function(code, stdout, stderr) {
                        //console.log(code, stdout, stderr)
                        out += stdout;
                        err += stderr;
                        if (code)
                            return next("Error: " + code + " " + stderr, stdout);
                        next();
                    }
                );
            })
            .end(function(err) {
                callback(err, out);
            });
    };

    this.ps = function() {
        var list = {};

        for (var pid in this.processes) {
            var child = this.processes[pid];

            // process has exited
            if (!child.pid || child.killed) {
                delete this.processes[pid];
            }
            else {
                list[pid] = child.describe();
                list[pid].extra = child.extra;
            }
        }

        return list;
    };

    this.debug = function(pid, debugMessage, callback) {
        var child = this.processes[pid];
        if (!child || !child.pid)
            return callback("Process is not running: " + pid);

        if (!child.debugCommand)
            return callback("Process does not support debugging: " + pid);

        child.debugCommand(debugMessage);
        callback();
    };

    this.kill = function(pid, callback) {
        var child = this.processes[pid];
        if (!child)
            return callback("Process does not exist");

        child.killed = true;
        child.kill("SIGKILL");
        callback();
    };

}).call(ProcessManager.prototype);
