/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var code = require("ext/code/code");
var editors = require("ext/editors/editors");
var WorkerClient = require("ace/worker/worker_client").WorkerClient;

var complete = require('ext/language/complete');
var marker = require('ext/language/marker');
var refactor = require('ext/language/refactor');
var outline = require('ext/language/outline');
var hierarchy = require('ext/language/hierarchy');
var format = require('ext/language/format');
var markup = require("text!ext/language/language.xml");
var skin = require("text!ext/language/skin.xml");
var css = require("text!ext/language/language.css");
var lang = require("ace/lib/lang");
var keyhandler = require("ext/language/keyhandler");

var markupSettings = require("text!ext/language/settings.xml");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/language/language", {
    name    : "Multiple Language Features",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors, code],
    nodes   : [],
    alone   : true,
    markup  : markup,
    skin    : skin,
    worker  : null,
    enabled : true,

    defaultKeyHandler: null,
    defaultCommandKeyHandler: null,

    hook : function() {
        var _self = this;

        var deferred = lang.deferredCall(function() {
            _self.setPath();
        });

        // We have to wait until the paths for ace are set - a nice module system will fix this
        ide.addEventListener("extload", function(){
            var worker = _self.worker = new WorkerClient(["treehugger", "ext", "ace", "c9"], "worker.js", "ext/language/worker", "LanguageWorker");
            complete.setWorker(worker);

            ide.addEventListener("afteropenfile", function(event){
                if (!event.node)
                    return;
                if (!editors.currentEditor || !editors.currentEditor.amlEditor) // No editor, for some reason
                    return;
                ext.initExtension(_self);
                var path = event.node.getAttribute("path");
                worker.call("switchFile", [path, editors.currentEditor.amlEditor.syntax, event.doc.getValue()]);
                event.doc.addEventListener("close", function() {
                    worker.emit("documentClose", {data: path});
                });
                // This is necessary to know which file was opened last, for some reason the afteropenfile events happen out of sequence
                deferred.cancel().schedule(100);
            });

            // Language features
            marker.hook(_self, worker);
            complete.hook(_self, worker);
            refactor.hook(_self, worker);
            outline.hook(_self, worker);
            hierarchy.hook(_self, worker);
            format.hook(_self, worker);

            worker.on("serverProxy", function(e) {
                console.log("proxyMessage", e.data);
                ide.send(JSON.stringify(e.data));
            });

            worker.on("commandRequest", function(e) {
                var cmd = e.data;
                if (cmd.command == "save") {
                  save.quicksave(tabEditors.getPage(), function() {
                    worker.emit("commandComplete", {
                     data: {
                      command: cmd.command,
                      success: true
                    }});
                  });
                }
            });

            ide.addEventListener("socketMessage", function(e) {
                var message = e.message;
                console.log("language: ", message);
                worker.emit("serverProxy", {data: message});
            });

            ide.dispatchEvent("language.worker", {worker: worker});
            ide.addEventListener("$event.language.worker", function(callback){
                callback({worker: worker});
            });
        }, true);
        
        ide.addEventListener("settings.load", function(){
            settings.setDefaults("language", [
                ["jshint", "true"],
                ["instanceHighlight", "true"],
                ["undeclaredVars", "true"],
                ["unusedFunctionArgs", "true"],
                ["continuousComplete", "false"]
            ]);
        });

        settings.addSettings("Language Support", markupSettings);
    },
    
    init : function() {
        var _self = this;
        var worker = this.worker;
        apf.importCssString(css);
        
        if (!editors.currentEditor || !editors.currentEditor.amlEditor)
            return;

        this.editor = editors.currentEditor.amlEditor.$editor;
        this.$onCursorChange = this.onCursorChangeDefer.bind(this);
        this.editor.selection.on("changeCursor", this.$onCursorChange);
        var oldSelection = this.editor.selection;
        this.setPath();

        ceEditor.addEventListener("loadmode", function(e) {
            if (e.name === "ace/mode/javascript") {
                e.mode.createWorker = function() {
                    return null;
                };
            }
        });
        
        this.updateSettings();
    
        this.editor.on("changeSession", function() {
            // Time out a litle, to let the page path be updated
            setTimeout(function() {
                _self.setPath();
                oldSelection.removeEventListener("changeCursor", _self.$onCursorChange);
                _self.editor.selection.on("changeCursor", _self.$onCursorChange);
                oldSelection = _self.editor.selection;
            }, 100);
        });
        

        this.editor.on("change", function(e) {
            e.range = {
                start: e.data.range.start,
                end: e.data.range.end
            };
            worker.emit("change", e);
            marker.onChange(_self.editor.session, e);
        });

        ide.addEventListener("liveinspect", function (e) {
            worker.emit("inspect", { data: { row: e.row, col: e.col } });
        });

        settings.model.addEventListener("update", this.updateSettings.bind(this));
        
        this.editor.addEventListener("mousedown", this.onEditorClick.bind(this));
        
    },

    setContinuousCompletion: function(enabled) {
        if(enabled) {
            if(!this.defaultKeyHandler) {
                this.defaultKeyHandler = this.editor.keyBinding.onTextInput;
                this.defaultCommandKeyHandler = this.editor.keyBinding.onCommandKey;
                this.editor.keyBinding.onTextInput = keyhandler.composeHandlers(keyhandler.typeAlongCompleteTextInput, this.defaultKeyHandler.bind(this.editor.keyBinding));
                this.editor.keyBinding.onCommandKey = keyhandler.composeHandlers(keyhandler.typeAlongComplete, this.defaultCommandKeyHandler.bind(this.editor.keyBinding));
            }
        }
        else {
            if(this.defaultKeyHandler) {
                this.editor.keyBinding.onTextInput = this.defaultKeyHandler;
                this.editor.keyBinding.onCommandKey = this.defaultCommandKeyHandler;
                this.defaultKeyHandler = null;
                this.defaultCommandKeyHandler = null;
            }
        }
    },
    
    isContinuousCompletionEnabled: function() {
        return !!this.defaultKeyHandler;
    },
    
    updateSettings: function() {
        // Currently no code editor active
        if (!editors.currentEditor || !editors.currentEditor.amlEditor || !tabEditors.getPage())
            return;
        if(settings.model.queryValue("language/@jshint") != "false")
            this.worker.call("enableFeature", ["jshint"]);
        else
            this.worker.call("disableFeature", ["jshint"]);
        if(settings.model.queryValue("language/@instanceHighlight") != "false")
            this.worker.call("enableFeature", ["instanceHighlight"]);
        else
            this.worker.call("disableFeature", ["instanceHighlight"]);
        if(settings.model.queryValue("language/@unusedFunctionArgs") != "false")
            this.worker.call("enableFeature", ["unusedFunctionArgs"]);
        else
            this.worker.call("disableFeature", ["unusedFunctionArgs"]);
        if(settings.model.queryValue("language/@undeclaredVars") != "false")
            this.worker.call("enableFeature", ["undeclaredVars"]);
        else
            this.worker.call("disableFeature", ["undeclaredVars"]);
        this.worker.call("setWarningLevel", [settings.model.queryValue("language/@warnLevel") || "info"]);
        var cursorPos = this.editor.getCursorPosition();
        cursorPos.force = true;
        this.worker.emit("cursormove", {data: cursorPos});
        this.setContinuousCompletion(settings.model.queryValue("language/@continuousComplete") == "true");
        this.setPath();
    },

    setPath: function() {
        // Currently no code editor active
        if(!editors.currentEditor || !editors.currentEditor.amlEditor || !tabEditors.getPage())
            return;
        var currentPath = tabEditors.getPage().getAttribute("id");
        this.worker.call("switchFile", [currentPath, editors.currentEditor.amlEditor.syntax, this.editor.getSession().getValue(), window.cloud9config.projectName]);
    },
    
    onEditorClick: function(event) {
        if(event.domEvent.altKey) {
            var pos = event.getDocumentPosition();
            this.worker.emit("jumpToDefinition", {data: pos});
        }
    },
    
    /**
     * Method attached to key combo for complete
     */
    complete: function() {
        complete.invoke();
    },

    registerLanguageHandler: function(modulePath, className) {
        var _self = this;

        // We have to wait until the paths for ace are set - a nice module system will fix this
        ide.addEventListener("extload", function(){
            _self.worker.call("register", [modulePath, className]);
        });
    },

    onCursorChangeDefer: function() {
        if(!this.onCursorChangeDeferred) {
            this.onCursorChangeDeferred = lang.deferredCall(this.onCursorChange.bind(this));
        }
        this.onCursorChangeDeferred.cancel().schedule(250);
    },

    onCursorChange: function() {
        this.worker.emit("cursormove", {data: this.editor.getCursorPosition()});
    },

    enable: function () {
        this.nodes.each(function (item) {
            item.enable();
        });

        this.disabled = false;
        this.setPath();
    },

    disable: function () {
        this.nodes.each(function (item) {
            item.disable();
        });

        this.disabled = true;
        marker.addMarkers({data:[]}, this.editor);
    },

    destroy: function () {
        // Language features
        marker.destroy();
        complete.destroy();
        refactor.destroy();

        this.nodes.each(function (item) {
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
