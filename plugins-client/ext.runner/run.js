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

module.exports = ext.register("ext/run/run", {
    dev   : "Ajax.org",
    name  : "Run",
    alone : true,
    type  : ext.GENERAL,

    processes: [],

    hook: function(){},

    init : function(){
        ide.addEventListener("socketMessage", function(message) {
            console.log("MSG", message);
            if (message.type === "processlist-change") {
                console.log("processlist-change", message.pid);
                processes = message.list;
            }
        });
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});
