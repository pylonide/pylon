"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

var DIRECT_OPEN_FILES = /\.(php|.?html?)$/;

/**
 * Run apache scripts with restricted user rights
 */

var exports = module.exports = function (url, vfs, pm, sandbox, usePortFlag, callback) {
    sandbox.getProjectDir(function(err, projectDir) {
        if (err) return callback(err);

        init(projectDir, url);
    });

    function init(projectDir, url) {
        pm.addRunner("apache", exports.factory(vfs, sandbox, projectDir, url, usePortFlag));

        callback();
    }
};

exports.factory = function(vfs, sandbox, root, url, usePortFlag) {
    return function(args, eventEmitter, eventName, callback) {
        var options = {};
        c9util.extend(options, args);
        options.root = root;
        options.file = args.file;
        options.args = args.args;
        options.cwd = args.cwd;
        options.env = args.env;
        options.apacheVersion = args.apacheVersion;
        options.encoding = args.encoding;
        options.eventEmitter = eventEmitter;
        options.eventName = eventName;
        options.url = url;

        options.sandbox = sandbox;

        new Runner(vfs, options, callback);
    };
};

var Runner = exports.Runner = function(vfs, options, callback) {
    var self = this;

    if (!options.sandbox) {
        return callback("No sandbox specified");
    }

    self.root = options.root;
    self.file = options.file || "";

    options.env = options.env || {};

    self.scriptArgs = options.args || [];
    self.apacheArgs = [];

    var suffix = DIRECT_OPEN_FILES.test(this.file) ? "/" + this.file : "";
    options.url += suffix;

    startProcess(options.url);

    function startProcess (url) {
        self.apacheArgs.push(self.root);

        // a nice message for our users when we fire up the process
        var messageListener = function (msg) {
            // process dies? then we die as well
            if (msg.type === "apache-exit") {
                return options.eventEmitter.removeListener(options.eventName, messageListener);
            }

            if (msg.type === "apache-start") {
                var info = [
                    "Your page is running at '" + url + "'."
                ];

                options.eventEmitter.emit(options.eventName, {
                    type: "apache-data",
                    stream: "stdout",
                    data: info.join("\n"),
                    extra: {tip: true},
                    pid: msg.pid
                });
            }
        };
        options.eventEmitter.on(options.eventName, messageListener);

        options.cwd = options.cwd ? options.cwd : options.root;
        options.command = "apache";

        ShellRunner.call(self, vfs, options, callback);
    }
};

util.inherits(Runner, ShellRunner);