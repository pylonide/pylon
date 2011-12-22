/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var noderunner = require("ext/noderunner/noderunner");
var WorkerClient = require("ace/worker/worker_client").WorkerClient;

var complete = require('ext/language/complete');
var marker = require('ext/language/marker');
var refactor = require('ext/language/refactor');
var liveInspect = require('ext/language/liveinspect');

var markup = require("text!ext/language/language.xml");
var skin = require("text!ext/language/skin.xml");
var css = require("text!ext/language/language.css");
var lang = require("ace/lib/lang");

var settings = require("text!ext/language/settings.xml");
var extSettings = require("ext/settings/settings");

module.exports = ext.register("ext/language/language", {
    name    : "Javascript Outline",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors, noderunner],
    nodes   : [],
    alone   : true,
    markup  : markup,
    skin    : skin,
    worker  : null,
    enabled : true,
    
    commands : {
        "complete": {hint: "code complete"},
        "renameVar": {hint: "Rename variable"}
    },

    hotitems: {},

    hook : function() {
		var _self = this;
        
        var deferred = lang.deferredCall(function() {
            _self.setPath();
        });
        
        var worker = this.worker = new WorkerClient(["treehugger", "ext", "ace", "c9"], null, "ext/language/worker", "LanguageWorker");
        complete.setWorker(worker);
        
        //ide.addEventListener("init.ext/code/code", function(){
		ide.addEventListener("afteropenfile", function(event){
            if (!event.node)
                return;
            if (!editors.currentEditor || !editors.currentEditor.ceEditor) // No editor, for some reason
                return;
            ext.initExtension(_self);
            var path = event.node.getAttribute("path");
            worker.call("switchFile", [path, editors.currentEditor.ceEditor.syntax, event.doc.getValue()]);
            event.doc.addEventListener("close", function() {
                worker.emit("documentClose", {data: path});
            });
            // This is necessary to know which file was opened last, for some reason the afteropenfile events happen out of sequence
            deferred.cancel().schedule(100);
	    });
        
        // Language features
        marker.hook(this, worker);
        complete.hook(this, worker);
        refactor.hook(this, worker);
        
        ide.dispatchEvent("language.worker", {worker: worker});
        ide.addEventListener("$event.language.worker", function(callback){
            callback({worker: worker});
        });
        
        ide.addEventListener("init.ext/settings/settings", function (e) {
            var heading = e.ext.getHeading("Language Support");
            heading.insertMarkup(settings);
        });
	},

    init : function() {
        var _self = this;
        var worker = this.worker;
        apf.importCssString(css);
        if (!editors.currentEditor || !editors.currentEditor.ceEditor)
            return;
        this.editor = editors.currentEditor.ceEditor.$editor;
        this.$onCursorChange = this.onCursorChangeDefer.bind(this);
        this.editor.selection.on("changeCursor", this.$onCursorChange);
        var oldSelection = this.editor.selection;
        this.setPath();
        
        this.setJSHint();
        this.setInstanceHighlight();
        this.setUnusedFunctionArgs();
        this.setUndeclaredVars();
        
        this.editor.on("changeSession", function(event) {
            // Time out a litle, to let the page path be updated
            setTimeout(function() {
                _self.setPath();
                oldSelection.removeEventListener("changeCursor", _self.$onCursorChange);
                _self.editor.selection.on("changeCursor", _self.$onCursorChange);
                oldSelection = _self.editor.selection;
            }, 100);
        });

        this.editor.addEventListener("change", function(e) {
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
    },
    
    setPath: function() {
        var page =  tabEditors.getPage();
        if (!page)
            return;
        var currentPath = page.getAttribute("id");

        // Currently no code editor active
        if(!editors.currentEditor.ceEditor || !tabEditors.getPage())
            return;
        var currentPath = tabEditors.getPage().getAttribute("id");
        this.worker.call("switchFile", [currentPath, editors.currentEditor.ceEditor.syntax, this.editor.getSession().getValue(), this.editor.getCursorPosition()]);
    },
    
    setJSHint: function() {
        if(extSettings.model.queryValue("language/@jshint") != "false")
            this.worker.call("enableFeature", ["jshint"]);
        else
            this.worker.call("disableFeature", ["jshint"]);
        this.setPath();
    },
    
    setInstanceHighlight: function() {
        if(extSettings.model.queryValue("language/@instanceHighlight") != "false")
            this.worker.call("enableFeature", ["instanceHighlight"]);
        else
            this.worker.call("disableFeature", ["instanceHighlight"]);
        var cursorPos = this.editor.getCursorPosition();
        cursorPos.force = true;
        this.worker.emit("cursormove", {data: cursorPos});
    },
    
    setUnusedFunctionArgs: function() {
        if(extSettings.model.queryValue("language/@unusedFunctionArgs") != "false")
            this.worker.call("enableFeature", ["unusedFunctionArgs"]);
        else
            this.worker.call("disableFeature", ["unusedFunctionArgs"]);
        this.setPath();
    },
    
    setUndeclaredVars: function() {
        if(extSettings.model.queryValue("language/@undeclaredVars") != "false")
            this.worker.call("enableFeature", ["undeclaredVars"]);
        else
            this.worker.call("disableFeature", ["undeclaredVars"]);
        this.setPath();
    },
    
    /**
     * Method attached to key combo for complete
     */
    complete: function() {
        complete.invoke();
    },
    
    registerLanguageHandler: function(modulePath, className) {
        this.worker.call("register", [modulePath, className]);
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

    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});
