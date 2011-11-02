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
var codecomplete = require("ext/codecomplete/codecomplete");
var tree = require('treehugger/tree');
var WorkerClient = require("ace/worker/worker_client").WorkerClient;

var markup = require("text!ext/jsoutline/outline.xml");
var skin = require("text!ext/jsoutline/skin.xml");
var Range = require("ace/range").Range;

module.exports = ext.register("ext/jsoutline/jsoutline", {
    name    : "Javascript Outline",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors, codecomplete],
    nodes   : [],
    alone   : true,
    markup  : markup,
    skin    : skin,
    commands : {
        "outline": {hint: "show outline mode"}
    },
    outline : [],

    hook : function() {
		var _self = this;
        console.log("Hooked js analysis!");

		ide.addEventListener("afteropenfile", function(){
            ext.initExtension(_self);
	    });
	},

    init : function() {
        var _self = this;
        var worker = this.$worker = new WorkerClient(["treehugger", "pilot", "ext", "ace"], null, "ext/jsoutline/worker", "AnalysisWorker");
        var currentPath = tabEditors.getPage().getAttribute("id");
        this.editor = editors.currentEditor.ceEditor.$editor;
        this.$onCursorChange = this.onCursorChange.bind(this);
        this.editor.selection.on("changeCursor", this.$onCursorChange);
        var oldSelection = this.editor.selection;
        worker.call("setEnabled", [currentPath.substring(currentPath.length-3) === '.js']);
        worker.call("setValue", [this.editor.getSession().getValue()]);
        worker.on("outline", this.renderOutline.bind(this));

        this.editor.on("changeSession", function(event) {
            // Time out a litle, to let the page path be updated
            $setTimeout(function() {
                var currentPath = tabEditors.getPage().getAttribute("id");
                worker.call("setValue", [event.session.getValue()]);
                worker.call("setEnabled", [currentPath.substring(currentPath.length-3) === '.js']);
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
    
    outlineJsonToXml: function(array, selected) {
        var xmlS = '';
        for (var i = 0; i < array.length; i++) {
            var elem = array[i];
            xmlS += '<entry name="' + elem.name + '" sl="' + elem.pos.sl + '" el="' + elem.pos.el + '" sc="' + elem.pos.sc + '" ec="' + elem.pos.ec + '"' + (elem === selected ? ' selected="true"' : '') + '>\n';
            xmlS += this.outlineJsonToXml(elem.items, selected);
            xmlS += '</entry>';
        }
        return xmlS;
    },
    
    findCursorInJson: function(json, cursor) {
        for (var i = 0; i < json.length; i++) {
            var elem = json[i];
            if(cursor.row < elem.pos.sl || cursor.row > elem.pos.el)
                continue;
            var inChildren = this.findCursorInJson(elem.items, cursor);
            return inChildren ? inChildren : elem;
        }
        return null;
    },
    
    renderOutline : function(event) {
        var ace = editors.currentEditor.ceEditor.$editor;
        var _self = this;
        this.outline = event.data;
        
        var selected = this.findCursorInJson(this.outline, this.editor.getCursorPosition());
        console.log('<data>' + this.outlineJsonToXml(this.outline, selected) + '</data>');
        mdlOutline.load(apf.getXml('<data>' + this.outlineJsonToXml(this.outline, selected) + '</data>'));
        
        var node = mdlOutline.queryNode("//entry[@selected]");
        treeOutline.select(node);
        var htmlNode = apf.xmldb.getHtmlNode(node, treeOutline);
        htmlNode.scrollIntoView();
        document.addEventListener("click", this.closeOutline);
        ace.container.addEventListener("DOMMouseScroll", this.closeOutline);
        ace.container.addEventListener("mousewheel", this.closeOutline);

        apf.popup.setContent("outline", barOutline.$ext);
        setTimeout(function() {
            apf.popup.show("outline", {
                x        : editors.currentEditor.ceEditor.getWidth()/2 - 150,
                y        : 0,
                animate  : false,
                ref      : ace.container,
                callback : function() {
                    barOutline.setHeight(300);
                    barOutline.setWidth(300);
                    sbOutline.$resize();
                    setTimeout(function() {
                        treeOutline.focus();
                    }, 100);
                }
            });
        }, 0);
    },
    
    jumpTo: function(el) {
        setTimeout(function() {
            var editor = editors.currentEditor.ceEditor.$editor;
            var range = new Range(+el.getAttribute("sl"), 0, +el.getAttribute("el"), Infinity);
            editor.selection.setSelectionRange(range);
            editor.centerSelection();
        });
    },
    
    jumpToAndClose: function(el) {
        this.closeOutline();
    },
    
    closeOutline : function() {
        barOutline.$ext.style.display = "none";
        setTimeout(function() {
            editors.currentEditor.ceEditor.$editor.focus();
        }, 100);
    },
    
    escapeOutline: function(event) {
        if(event.keyCode === 27) {
            this.closeOutline();
        }
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