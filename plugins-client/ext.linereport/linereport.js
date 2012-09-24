/**
 * Line reporter core for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var language = require("ext/language/language");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/linereport/linereport", {
    name     : "linereport",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    disabled : false,
    deps     : [language, editors],
    nodes : [],
    
    hook: function() {
        language.worker.on("linereport_invoke", function(event) {
            if (ext.disabled)
                return;
            ide.send(event.data.command);
        });
        ide.addEventListener("socketMessage", function(event) {
            console.log("linereport.onMessage: ", event.type || event);
        });
        // Make sure base is initialized and kept up-to-date
        language.registerLanguageHandler("ext/linereport/linereport_base");
    },
    
    enable: function() {
        this.disabled = false;
    },

    disable: function() {
        this.disabled = true;
    },

    destroy: function() {
        this.disabled = true;
    }
    
});

});
