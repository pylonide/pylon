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

var outline = require('ext/language/outline');
var markup = require("text!ext/language/outline.xml");
var skin = require("text!ext/language/skin.xml");

module.exports = ext.register("ext/language/language", {
    name    : "Javascript Outline",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors],
    nodes   : [],
    alone   : true,
    markup  : markup,
    skin    : skin,
    commands : {
        "outline": {hint: "show outline"}
    },

    hook : function() {
		var _self = this;
        console.log("Hooked language support.");

		ide.addEventListener("afteropenfile", function(){
            ext.initExtension(_self);
	    });
	},

    init : function() {
        var _self = this;
        var worker = this.$worker = new WorkerClient(["treehugger", "pilot", "ext", "ace", "c9"], null, "ext/language/worker", "LanguageWorker");
        var currentPath = tabEditors.getPage().getAttribute("id");
        this.editor = editors.currentEditor.ceEditor.$editor;
        this.$onCursorChange = this.onCursorChange.bind(this);
        this.editor.selection.on("changeCursor", this.$onCursorChange);
        var oldSelection = this.editor.selection;
        worker.call("setPath", [currentPath]);
        worker.call("setValue", [this.editor.getSession().getValue()]);
        
        // Language features
        worker.on("outline", function(event) {
            outline.renderOutline(event);
        });

        this.editor.on("changeSession", function(event) {
            // Time out a litle, to let the page path be updated
            $setTimeout(function() {
                var currentPath = tabEditors.getPage().getAttribute("id");
                worker.call("setValue", [event.session.getValue()]);
                worker.call("setPath", [currentPath]);
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
    
    /**
     * Method attached to key combo for outline
     */
    outline : function() {
        this.$worker.emit("outline", {});
    },
    
    registerLanguageHandler: function(modulePath, className) {
        this.$worker.call("register", [modulePath, className]);
    },

    onCursorChange: function() {
        this.$worker.emit("cursormove", {data: this.editor.getCursorPosition()});
    },

    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});