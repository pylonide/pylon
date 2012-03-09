"use strict";

var ProcessManager = require("./process_manager");
var EventEmitter = require("events").EventEmitter;


module.exports = function setup(options, imports, register) {

    var runners = {};

    var eventEmitter = new EventEmitter();
    var pm = new ProcessManager(runners, eventEmitter);

    register(null, {
        "onDestruct": function(callback) {
            pm.destroy(callback);
        },
        "process-manager": {
            on: eventEmitter.on.bind(eventEmitter),
            ps: function(callback) {
                callback(null, pm.ps());
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
            }
        }
    });
};