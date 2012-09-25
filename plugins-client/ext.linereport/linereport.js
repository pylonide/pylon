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
    nodes    : [],
    
    buffers : {},
    saveTriggers : {},
    
    hook: function() {
        language.worker.on("linereport_invoke", this.onWorkerMessage.bind(this));
        ide.addEventListener("socketMessage", this.onServerMessage.bind(this));
        ide.addEventListener("afterfilesave", this.onFileSave.bind(this));
        // Make sure base is initialized and kept up-to-date
        language.registerLanguageHandler("ext/linereport/linereport_base");
    },
    
    onWorkerMessage : function(event) {
        if (ext.disabled)
            return;
        this.saveTriggers[event.path] = function() {
            ide.send(event.data.command);
        };
    },
    
    onServerMessage : function(event) {
        var id = event.message.extra && event.message.extra.linereport_id;
        if (!id)
            return;
        switch (event.message.type) {
            case "npm-module-data":
                this.buffers[id] = (this.buffers[id] || "") + event.message.data;
                break;
            case "npm-module-exit":
                language.worker.emit("linereport_invoke_result", {
                    id: id,
                    code: event.message.code,
                    output: this.buffers[id] || ""
                });
                delete this.buffers[id];
                break;
        }
    },
    
    onFileSave: function(event) {
        if (this.saveTriggers[event.oldPath]) {
            this.saveTriggers[event.oldPath]();
            delete this.saveTriggers[event.oldPath];
        }
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
