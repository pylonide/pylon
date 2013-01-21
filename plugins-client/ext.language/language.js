/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var util = require("core/util");
var code = require("ext/code/code");
var editors = require("ext/editors/editors");
var EditSession = require("ace/edit_session").EditSession;
var WorkerClient = require("ace/worker/worker_client").WorkerClient;
var UIWorkerClient = require("ace/worker/worker_client").UIWorkerClient;
var useUIWorker = window.location && /[?&]noworker=1/.test(window.location.search);

var complete = require("ext/language/complete");
var marker = require("ext/language/marker");
var refactor = require("ext/language/refactor");
var outline = require("ext/language/outline");
var markup = require("text!ext/language/language.xml");
var skin = require("text!ext/language/skin.xml");
var css = require("text!ext/language/language.css");
var lang = require("ace/lib/lang");
var keyhandler = require("ext/language/keyhandler");
var jumptodef = require("ext/language/jumptodef");
var menus = require("ext/menus/menus");

var markupSettings = require("text!ext/language/settings.xml");
var settings = require("ext/settings/settings");
var isContinuousCompletionEnabled;

/*global tabEditors:true cloud9config:true */

module.exports = ext.register("ext/language/language", {
    name    : "Javascript Language Services",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors, code, menus],
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

        // We have to wait until the paths for ace are set - a nice module system will fix this
        ide.addEventListener("extload", function() {
            var Worker = useUIWorker ? UIWorkerClient : WorkerClient;
            var worker = _self.worker = new Worker(["treehugger", "ext", "ace", "c9"], "ext/language/worker", "LanguageWorker");
            complete.setWorker(worker);

            ide.addEventListener("closefile", function(e){
                var path = e.page && e.page.id;
                if (path)
                    worker.emit("documentClose", {data: path});
            });

            ide.addEventListener("afteropenfile", function(event){
                if (!event.node)
                    return;
                if (!editors.currentEditor || !editors.currentEditor.amlEditor) // No editor, for some reason
                    return;
                ext.initExtension(_self);

                var path = event.node.getAttribute("path");
                var editor = editors.currentEditor.amlEditor;
                // background tabs=open document, foreground tab=switch to file
                // this is needed because with concorde changeSession event is fired when document is still empty
                var isVisible = editor.xmlRoot == event.node;
                worker.call(isVisible ? "switchFile" : "documentOpen", [
                    util.stripWSFromPath(path),
                    editor.syntax,
                    event.doc.getValue(),
                    null,
                    ide.workspaceDir
                ]);
            });

            // Language features
            marker.hook(_self, worker);
            complete.hook(_self, worker);
            refactor.hook(_self, worker);
            outline.hook(_self, worker);
            keyhandler.hook(_self, worker);
            jumptodef.hook(_self, worker);

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

    isWorkerEnabled : function () {
        return !useUIWorker;
    },

    isInferAvailable : function() {
        return cloud9config.hosted || !!require("core/ext").extLut["ext/jsinfer/jsinfer"];
    },

    init : function() {
        var _self = this;
        var worker = this.worker;
        apf.importCssString(css);

        if (!editors.currentEditor || editors.currentEditor.path != "ext/code/code")
            return;

        this.editor = editors.currentEditor.amlEditor.$editor;
        this.$onCursorChange = this.onCursorChangeDefer.bind(this);
        this.editor.session.selection.on("changeCursor", this.$onCursorChange);
        var oldSession = this.editor.session;
        this.setPath();

        this.updateSettings();

        var defaultHandler = this.editor.keyBinding.onTextInput.bind(this.editor.keyBinding);
        var defaultCommandHandler = this.editor.keyBinding.onCommandKey.bind(this.editor.keyBinding);
        this.editor.keyBinding.onTextInput = keyhandler.composeHandlers(keyhandler.onTextInput, defaultHandler);
        this.editor.keyBinding.onCommandKey = keyhandler.composeHandlers(keyhandler.onCommandKey, defaultCommandHandler);

        this.editor.on("changeSession", function() {
            oldSession.selection.removeEventListener("changeCursor", _self.$onCursorChange);
            _self.editor.selection.on("changeCursor", _self.$onCursorChange);
            oldSession = _self.editor.session;
            clearTimeout(_self.$timeout);
            // Time out a litle, to let the page path be updated
            _self.$timeout = setTimeout(function() {
                _self.setPath();
            }, 100);
        });

        this.editor.on("changeMode", function() {
            _self.$timeout = setTimeout(function() {
                _self.setPath();
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
        if (!editors.currentEditor || !editors.currentEditor.amlEditor || !ide.getActivePage())
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
        if(!editors.currentEditor || editors.currentEditor.path != "ext/code/code" || !tabEditors.getPage() || !this.editor)
            return;
        var path = ide.getActivePage().getAttribute("id");
        this.worker.call("switchFile", [
            util.stripWSFromPath(path),
            editors.currentEditor.amlEditor.syntax,
            this.editor.getValue(),
            this.editor.getCursorPosition(),
            ide.workspaceDir
        ]);
    },

    onEditorClick: function(event) {
    },

    /**
     * Method attached to key combo for complete
     */
    complete: function() {
        complete.invoke();
    },

    /**
     * Registers a new language handler.
     * @param modulePath  the require path of the handler
     * @param contents    (optionally) the contents of the handler script
     */
    registerLanguageHandler: function(modulePath, contents) {
        var _self = this;

        // We have to wait until the paths for ace are set - a nice module system will fix this
        ide.addEventListener("extload", function(){
            _self.worker.call("register", [modulePath, contents]);
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
        this.$enable();
        this.setPath();
    },

    disable: function () {
        this.$disable();
        marker.addMarkers({data:[]}, this.editor);
    },

    destroy: function () {
        // Language features
        marker.destroy();
        complete.destroy();
        refactor.destroy();
        this.$destroy();
    }
});

});
