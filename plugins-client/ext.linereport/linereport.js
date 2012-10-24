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
        var _self = this;
        ide.addEventListener("init.ext/language/language", function() {
            language.worker.on("linereport_invoke", _self.onWorkerMessage.bind(_self));
            ide.addEventListener("socketMessage", _self.onServerMessage.bind(_self));
            ide.addEventListener("afterfilesave", _self.onFileSave.bind(_self));
            // Make sure base is initialized and kept up-to-date
            language.registerLanguageHandler("ext/linereport/linereport_base");
        });
    },
    
    onWorkerMessage : function(event) {
        var doc = window.tabEditors.getPage().$doc;
        var path = event.data.path;
        if (ext.disabled || !doc || (path && path !== doc.getNode().getAttribute("path")))
            return;
        function send() {
            window.ide.send(event.data.command);
        }
        if (!path || !doc.getNode().getAttribute("changed") || doc.getNode().getAttribute("changed") == "0")
            send();
        else
            this.saveTriggers[path] = send;
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
                language.worker.emit("linereport_invoke_result", {data: {
                    id: id,
                    code: event.message.code,
                    output: this.buffers[id] || ""
                }});
                delete this.buffers[id];
                break;
        }
    },
    
    onFileSave: function(event) {
        if (this.saveTriggers[event.oldpath]) {
            this.saveTriggers[event.oldpath]();
            delete this.saveTriggers[event.oldpath];
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
