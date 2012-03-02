"use strict";

module.exports = function startup(options, imports, register) {
    var logger = new LogService();

    register(null, {
        log: {
            info: logger.info.bind(logger),
            warn: logger.warn.bind(logger),
            error: logger.error.bind(logger)
        }
    });
};

var LogService = module.exports.LogService = function() {};

(function() {

    this.info = function() {
        console.log.apply(console, arguments);
    };

    this.warn = function() {
        console.log.apply(console, arguments);
    };

    this.error = function() {
        console.log.apply(console, arguments);
    };

}).call(LogService.prototype);