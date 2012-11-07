/**
 * This is the running process manager. It will keep synchronized with the server
 * side running process manager, so thye both know what processes are running on
 * a given moment. This way, plugins in the client don't have to talk to the server,
 * but just ask locally.
 *
 * @copyright 2012, Ajax.org B.V.
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

var processes = [];

module.exports = ext.register("ext/runner/runner", {
    dev   : "Ajax.org",
    name  : "Runner",
    alone : true,
    type  : ext.GENERAL,

    processes: [],

    init: function(){},

    hook: function() {
        ide.addEventListener("socketMessage", function(e) {
            var message = e.message;
            if (message.type === "processlist") {
                console.log("processlist-change", message.subtype, message.pid);
                processes = message.list;
            }
        });
    },

    enable: function() {},
    disable: function() {},
    destroy: function() {}
});

});
