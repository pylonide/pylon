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
    
    },
    
    initReporter: function(command, callback) {
        // For now, this is an alias of invokeReporter
        this.invokeReporter(command, callback);
    },

    invokeReporter: function(command, callback) {
        
    },
    
    parseReporterOutput: function(output) {
        parser.parseOutput(output);
    }
    
});

});
