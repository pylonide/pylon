"use strict";

var ProcessManager = require("./process_manager");

module.exports = function setup(options, imports, register) {

    var runners = {};

    var eventEmitter = imports.eventbus;
    var pm = new ProcessManager(runners, eventEmitter);

    register(null, {
        "onDestroy": function() {
            pm.destroy();
        },
        "process-manager": {
            ps: function(callback) {
                callback(null, pm.ps());
            },
            runnerTypes: function(callback) {
                callback(null, pm.runnerTypes());
            },
            debug: pm.debug.bind(pm),
            spawn: pm.spawn.bind(pm),
            exec: function(runnerId, options, callback) {
                pm.exec(runnerId, options, function(err, pid) {
                    if (err)
                        return callback(err);
                }, callback);
            },
            kill: pm.kill.bind(pm),
            addRunner: function(name, runner) {
                runners[name] = runner;
            },
            execCommands: pm.execCommands.bind(pm),
            destroy: pm.destroy.bind(pm),
            prepareShutdown: pm.prepareShutdown.bind(pm)
        }
    });
};