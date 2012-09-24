/**
 * Line reporter core for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var parser = require("ext/linereport/linereport");

module.exports = ext.register("ext/linereport/linereport", {
    name     : "linereport",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    disabled : false,
    nodes : [],
    
    $commandId: 0,
    
    callbacks: {},
    
    hook: function() { // TODO
        ide.addEventListener("socketMessage", this.onMessage.bind(this));
    },
    
    onMessage: function(e) { // TODO
        console.log("linereport.onMessage: ", e);
    },
    
    initReporter: function(checkInstall, performInstall, callback) {
        this.invoke("if ! " + checkInstall + "; then " + performInstall + "; fi", callback);
    },

    invokeReporter: function(command, callback) {
        var _self = this;
        this.invoke(command, function(err, output) {
            if (err)
                return callback();
            callback(_self.parseReporterOutput(output));
        });
    },
    
    invoke: function(command, callback) {
        var id = this.$commandId++;
        var data = {
            command: "alert",
            argv: ["alert","1"],
            line: "alert 1",
            cwd: "/",
            requireshandling: true,
            tracer_id: id,
            extra: { command_id: id }
        };
        ide.send(data);
        this.callbacks[id] = callback;
    },
    
    parseReporterOutput: function(output) {
        parser.parseOutput(output);
    }
    
});

});
