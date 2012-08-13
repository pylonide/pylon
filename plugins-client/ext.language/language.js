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
var EditSession = require("ace/edit_session").EditSession;
var WorkerClient = require("ace/worker/worker_client").WorkerClient;
var createUIWorkerClient = require("ext/language/worker").createUIWorkerClient;
var isWorkerEnabled = require("ext/language/worker").isWorkerEnabled;

var complete = require('ext/language/complete');
var marker = require('ext/language/marker');
var refactor = require('ext/language/refactor');
var outline = require('ext/language/outline');
var markup = require("text!ext/language/language.xml");
var skin = require("text!ext/language/skin.xml");
var css = require("text!ext/language/language.css");
var lang = require("ace/lib/lang");
var keyhandler = require("ext/language/keyhandler");

var markupSettings = require("text!ext/language/settings.xml");
var settings = require("ext/settings/settings");
var isContinuousCompletionEnabled;

/*global tabEditors:true cloud9config:true */

module.exports = ext.register("ext/language/language", {
    name    : "Javascript Language Services",
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
        
        if (!createUIWorkerClient || !isWorkerEnabled)
            throw new Error("Language worker not loaded or updated; run 'sm install' or 'make worker'");

        var deferred = lang.deferredCall(function() {
            _self.setPath();
        });

        // We have to wait until the paths for ace are set - a nice module system will fix this
        ide.addEventListener("extload", function() {
            var worker;
            if (!isWorkerEnabled()) {
                worker = _self.worker = createUIWorkerClient();
            }
            else {
                worker = _self.worker = new WorkerClient(
                    ["treehugger", "ext", "ace", "c9"], "ext/language/worker", "LanguageWorker");
            }
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
            keyhandler.hook(_self, worker);

            ide.dispatchEvent("language.worker", {worker: worker});
            ide.addEventListener("$event.language.worker", function(callback){
                callback({worker: worker});
            });
        }, true);
        
        ide.addEventListener("settings.load", function() {
            settings.setDefaults("language", [
                ["jshint", "true"],
                ["instanceHighlight", "true"],
                ["undeclaredVars", "true"],
                ["unusedFunctionArgs", "false"],
                ["continuousCompletion", _self.isInferAvailable() ? "true" : "false"]
            ]);
        });

        settings.addSettings("Language Support", markupSettings);

        // disable ace worker
        if (!EditSession.prototype.$startWorker_orig) {
            EditSession.prototype.$startWorker_orig = EditSession.prototype.$startWorker;
            EditSession.prototype.$startWorker = function() {
                if (this.$modeId != "ace/mode/javascript")
                    this.$startWorker_orig();
            };
        }
    },

    isInferAvailable : function() {
        return cloud9config.hosted || !!require("core/ext").extLut["ext/jsinfer/jsinfer"];
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

        this.updateSettings();
        
        var defaultHandler = this.editor.keyBinding.onTextInput.bind(this.editor.keyBinding);
        var defaultCommandHandler = this.editor.keyBinding.onCommandKey.bind(this.editor.keyBinding);
        this.editor.keyBinding.onTextInput = keyhandler.composeHandlers(keyhandler.onTextInput, defaultHandler);
        this.editor.keyBinding.onCommandKey = keyhandler.composeHandlers(keyhandler.onCommandKey, defaultCommandHandler);
    
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
    
    isContinuousCompletionEnabled: function() {
        return isContinuousCompletionEnabled;
    },
    
    setContinuousCompletionEnabled: function(value) {
        isContinuousCompletionEnabled = value;
    },
    
    updateSettings: function(e) {
        // check if some other setting was changed
        if (e && e.xmlNode && e.xmlNode.tagName != "language")
            return;
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
        isContinuousCompletionEnabled = settings.model.queryValue("language/@continuousCompletion") != "false";
        this.setPath();
    },

    setPath: function() {
        // Currently no code editor active
        if(!editors.currentEditor || !editors.currentEditor.ceEditor || !tabEditors.getPage() || !this.editor)
            return;
        var currentPath = tabEditors.getPage().getAttribute("id");
        this.worker.call("switchFile", [currentPath, editors.currentEditor.ceEditor.syntax, this.editor.getSession().getValue(), this.editor.getCursorPosition()]);
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
