var EventEmitter = require("events").EventEmitter;

module.exports = function startup(options, imports, register) {

    var eventbus = new EventEmitter();

    register(null, {
        "eventbus": {
            on: eventbus.on.bind(eventbus),
            emit: eventbus.emit.bind(eventbus),
            removeAllListeners: eventbus.removeAllListeners.bind(eventbus),
            removeListener: eventbus.removeListener.bind(eventbus)
        }
    });
};