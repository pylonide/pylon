/**
 * Code completion for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */


define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var WorkerClient = require("ace/worker/worker_client").WorkerClient;
var Range = require("ace/range").Range;

var outline = require('ext/language/outline');
var complete = require('ext/language/complete');
var marker = require('ext/language/marker');

var markup = require("text!ext/language/language.xml");
var skin = require("text!ext/language/skin.xml");
var lang = require("pilot/lang");
var codetools = require("ext/codetools/codetools");

module.exports = ext.register("ext/language/language", {
    name    : "Javascript Outline",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors, codetools],
    nodes   : [],
    alone   : true,
    markup  : markup,
    skin    : skin,
    worker  : null,
    
    commands : {
        "outline": {hint: "show outline"},
        "complete": {hint: "code complete"}
    },

    hook : function() {
		var _self = this;
        
        var deferred = lang.deferredCall(function() {
            _self.setPath();
        });

        var worker = this.worker = new WorkerClient(["treehugger", "pilot", "ext", "ace", "c9"], null, "ext/language/worker", "LanguageWorker");
        complete.setWorker(worker);
		ide.addEventListener("afteropenfile", function(event){
            ext.initExtension(_self);
            if (!event.node) return;
            if (!editors.currentEditor || !editors.currentEditor.ceEditor) // No editor, for some reason
                return;
            var path = event.node.getAttribute("path");
            worker.call("switchFile", [path, editors.currentEditor.ceEditor.syntax, event.doc.getValue()]);
            event.doc.addEventListener("close", function() {
                worker.emit("documentClose", {data: path});
            });
            // This is necessary to know which file was opened last, for some reason the afteropenfile event happens out of sequence
            deferred.cancel().schedule(100);
	    });
        /*
        ide.addEventListener("codetools.hoverchange", function(event) {
            marker.checkForAnno(event.pos, true);
        });
        */
        // Language features
        worker.on("outline", function(event) {
            outline.renderOutline(event);
        });
        worker.on("complete", function(event) {
            complete.onComplete(event);
        });
        worker.on("markers", function(event) {
            marker.markers(event, _self.editor);
        });
        worker.on("hint", function(event) {
            marker.showHint(event.data);
        });
        worker.on("hidehint", function() {
            marker.hideHint();
        });
	},

    init : function() {
        var _self = this;
        var worker = this.worker;
        this.editor = editors.currentEditor.ceEditor.$editor;
        this.$onCursorChange = this.onCursorChangeDefer.bind(this);
        this.editor.selection.on("changeCursor", this.$onCursorChange);
        var oldSelection = this.editor.selection;
        this.setPath();
        
        this.editor.on("changeSession", function(event) {
            // Time out a litle, to let the page path be updated
            setTimeout(function() {
                var currentPath = tabEditors.getPage().getAttribute("id");
                _self.setPath();
                oldSelection.removeEventListener("changeCursor", _self.$onCursorChange);
                _self.editor.selection.on("changeCursor", _self.$onCursorChange);
                oldSelection = _self.editor.selection;
            });
        });

        this.editor.addEventListener("change", function(e) {
            marker.removeMarkers(_self.editor);
            e.range = {
                start: e.data.range.start,
                end: e.data.range.end
            };
            worker.emit("change", e);
        });
    },
    
    setPath: function() {
        var _self = this;
        var currentPath = tabEditors.getPage().getAttribute("id");
        _self.worker.call("switchFile", [currentPath, editors.currentEditor.ceEditor.syntax, _self.editor.getSession().getValue()]);
    },
    
    /**
     * Method attached to key combo for outline
     */
    outline : function() {
        this.worker.emit("outline", {});
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
        this.onCursorChangeDeferred.cancel().schedule(505);
    },
    
    onCursorChange: function() {
        this.worker.emit("cursormove", {data: this.editor.getCursorPosition()});
        //marker.checkForAnno(pos, false);
    },

    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});