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
var tree = require('treehugger/tree');
var WorkerClient = require("ace/worker/worker_client").WorkerClient;
var Range = require("ace/range").Range;

var outline = require('ext/language/outline');
var complete = require('ext/language/complete');

var markup = require("text!ext/language/language.xml");
var skin = require("text!ext/language/skin.xml");
var lang = require("pilot/lang");


module.exports = ext.register("ext/language/language", {
    name    : "Javascript Outline",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors],
    nodes   : [],
    alone   : true,
    markup  : markup,
    skin    : skin,
    worker  : null,
    
    commands : {
        "outline": {hint: "show outline"},
        "complete": {hint: "code complete"},
        "analyze": {hint: "analyze code"}
    },

    hook : function() {
		var _self = this;
        
        var deferred = lang.deferredCall(function() {
            _self.setPath();
        });

		ide.addEventListener("afteropenfile", function(event){
            ext.initExtension(_self);
            if (!event.node) return;
            if (!editors.currentEditor || !editors.currentEditor.ceEditor) // No editor, for some reason
                return;
            var path = event.node.getAttribute("path");
            console.log("Open file: " + path);
            worker.call("switchFile", [path, editors.currentEditor.ceEditor.syntax, event.doc.getValue()]);
            event.doc.addEventListener("close", function() {
                worker.emit("documentClose", {data: path});
            });
            // This is necessary to know which file was opened last, for some reason the afteropenfile event happens out of sequence
            deferred.cancel().schedule(100);
	    });
        var worker = this.worker = new WorkerClient(["treehugger", "pilot", "ext", "ace", "c9"], null, "ext/language/worker", "LanguageWorker");
        complete.setWorker(worker);
        // Language features
        worker.on("outline", function(event) {
            outline.renderOutline(event);
        });
        worker.on("complete", function(event) {
            complete.onComplete(event);
        });
        worker.on("markers", function(event) {
            _self.markers(event);
        });
	},

    init : function() {
        var _self = this;
        var worker = this.worker;
        this.editor = editors.currentEditor.ceEditor.$editor;
        this.$onCursorChange = this.onCursorChange.bind(this);
        this.editor.selection.on("changeCursor", this.$onCursorChange);
        var oldSelection = this.editor.selection;
        this.setPath();
        
        this.editor.on("changeSession", function(event) {
            console.log("Change session");
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
            e.range = {
                start: e.data.range.start,
                end: e.data.range.end
            };
            worker.emit("change", e);
        });
    },
    
    setPath: function() {
        var _self = this;
        //setTimeout(function() {
        var currentPath = tabEditors.getPage().getAttribute("id");
        console.log(currentPath);
        _self.worker.call("switchFile", [currentPath, editors.currentEditor.ceEditor.syntax, _self.editor.getSession().getValue()]);
        //}, 0);
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
    
    /**
     * Method attached to key combo for outline
     */
    analyze : function() {
        console.log("Triggered analysis");
        this.worker.emit("analyze", {});
    },
    
    currentMarkers: [],
    
    markers: function(event) {
        var annos = event.data;
        var session = this.editor.session;
        var _self = this;
        
        for (var i = 0; i < this.currentMarkers.length; i++) {
            session.removeMarker(this.currentMarkers[i]);
        }
        this.currentMarkers = [];
        
        annos.forEach(function(anno) { 
            var range = Range.fromPoints({
                row: anno.node.sl,
                column: anno.node.sc
            }, {
                row: anno.node.el,
                column: anno.node.ec
            });
            var text = session.getTextRange(range);
            console.log("Text: " + text);
            var spaces = '';
            for (var i = 0; i < text.length; i++) {
                spaces += '&nbsp;';
            }
            _self.currentMarkers.push(session.addMarker(range, "language_highlight", function(stringBuilder, range, left, top, viewport) {
                stringBuilder.push(
                    "<span id='myelement' class='language_highlight' onclick='alert(\'hello\')' style='border-bottom: dotted 1px red; ",
                    "left:", left, "px;",
                    "top:", top, "px;",
                    "height:", viewport.lineHeight, "px;",
                    "'>", spaces, "</span>"
                );
            }, true));
        });
    },
    
    registerLanguageHandler: function(modulePath, className) {
        this.worker.call("register", [modulePath, className]);
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