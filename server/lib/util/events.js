/**
 * Events Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Async = require("async");

exports.EventEmitter = function() {};

exports.EventEmitter.DEFAULT_TIMEOUT = 2000; // in milliseconds

(function() {
    this.dispatchEvent = function() {
        this.$eventRegistry = this.$eventRegistry || {};

        var e,
            args       = Array.prototype.slice.call(arguments),
            eventName  = args.shift().toLowerCase(),
            listeners  = this.$eventRegistry[eventName] || [],
            cbdispatch = (typeof args[args.length - 1] == "function")
                ? args.pop()
                : function(){};
        if (!listeners.length)
            return cbdispatch();

        Async.list(listeners).each(function(listener, cbnext) {
            e = new exports.Event(eventName, args, cbnext);
            listener.apply(null, [e].concat(args));
            if (listener.$usetimeout > 0) {
                clearTimeout(listener.$timeout);
                listener.$timeout = setTimeout(function() {
                    if (!e.$done) {
                        e.next("Event callback timeout: timeout reached, no callback fired within "
                            + listener.$usetimeout + "ms");
                    }
                }, listener.$usetimeout);
            }
        }).end(function(err) {
            cbdispatch(err);
        });
    };

    this.addEventListener = function(eventName, listener, timeout) {
        this.$eventRegistry  = this.$eventRegistry || {};
        listener.$usetimeout = timeout === false
            ? 0
            : (typeof timeout == "number")
                ? timeout
                : exports.EventEmitter.DEFAULT_TIMEOUT;

        eventName = eventName.toLowerCase();
        var listeners = this.$eventRegistry[eventName];
        if (!listeners)
            listeners = this.$eventRegistry[eventName] = [];
        if (listeners.indexOf(listener) == -1)
            listeners.push(listener);
    };

    this.removeEventListener = function(eventName, listener) {
        this.$eventRegistry = this.$eventRegistry || {};

        eventName = eventName.toLowerCase();
        var listeners = this.$eventRegistry[eventName];
        if (!listeners)
            return;
        var index = listeners.indexOf(listener);
        if (index !== -1)
            listeners.splice(index, 1);
    };
}).call(exports.EventEmitter.prototype);

exports.Event = function(type, args, callback) {
    this.$event = true;
    this.$done  = false;
    this.type   = type;
    this.returnValue = null;

    this.next = function(err) {
        if (this.$done || !callback)
            return (!callback ? this.$done = true : false);
        this.$done = true;
        callback.apply(null, [err].concat(args || []));
    };

    this.stop = function() {
        return this.next(this.returnValue = true);
    };
};
