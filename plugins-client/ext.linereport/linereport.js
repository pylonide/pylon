/**
 * Line reporter core for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var language = require("ext/language/language");
var editors = require("ext/editors/editors");
var settings = require("ext/settings/settings");
var autosave = require("ext/autosave/autosave");

module.exports = ext.register("ext/linereport/linereport", {
    name     : "linereport",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    disabled : false,
    deps     : [language, editors],
    nodes    : [],

    stdoutBuffers : {},
    stderrBuffers : {},
    saveTriggers  : {},
    firstUsed     : false,

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
        if (ide.readonly || this.isCollabSlave()) {
            this.disabled = true;
            return;
        }

        if (!this.firstUsed && event.data.path) {
            this.firstUsed = true;
            this.onFirstUse(event);
        }

        var doc = ide.getActivePage() && ide.getActivePage().$doc;
        var path = event.data.path;
        if (ext.disabled || !doc || (path && path !== util.stripWSFromPath(doc.getNode().getAttribute("path"))))
            return;
        function send() {
            ide.send(event.data.command);
        }
        if (!path || !doc.getNode().getAttribute("changed") || doc.getNode().getAttribute("changed") == "0")
            send();
        else
            this.saveTriggers[path] = send;
    },

    isCollabSlave : function() {
         var collab = require("core/ext").extLut["ext/collaborate/collaborate"];
         // Use != here instead of !== since we may compare numbers and strings. Yup.
         return collab && collab.ownerUid && collab.myUserId != collab.ownerUid;
    },

    onServerMessage : function(event) {
        var message = event.message;
        var id = message.extra && message.extra.linereport_id;
        if (!id)
            return;
        switch (message.type) {
            case "npm-module-data":
                if (event.message.stream === "stdout")
                    this.stdoutBuffers[id] = (this.stdoutBuffers[id] || "") + event.message.data;
                else
                    this.stderrBuffers[id] = (this.stderrBuffers[id] || "") + event.message.data;

                break;
            case "npm-module-exit":
                language.worker.emit("linereport_invoke_result", {data: {
                    id: id,
                    code: event.message.code,
                    stdout: this.stdoutBuffers[id] || "",
                    stderr: this.stderrBuffers[id] || ""
                }});
                if (this.stdoutBuffers[id])
                    delete this.stdoutBuffers[id];
                if (this.stderrBuffers[id])
                    delete this.stderrBuffers[id];
                break;
        }
    },

    onFileSave: function(event) {
        var oldPath = util.stripWSFromPath(event.oldpath);
        if (this.saveTriggers[oldPath]) {
            this.saveTriggers[oldPath]();
            delete this.saveTriggers[oldPath];
        }
    },

    onFirstUse: function(event) {
        // Enable autosave since it makes linereport trigger automatically
        autosave.isAutoSaveEnabled = true;
        settings.model.setQueryValue("general/@autosaveenabled", true);
        ide.dispatchEvent("track_action", {
            type: "linereport_firstuse",
            language: event.data.language,
            source: event.data.source
        });
    }

});

});
