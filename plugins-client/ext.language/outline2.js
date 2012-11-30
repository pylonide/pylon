/**
 * Outline support.
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var editors = require("ext/editors/editors");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var dock = require("ext/dockpanel/dockpanel");
var Range = require("ace/range").Range;
var search = require("ext/gotofile/search");
var markup = require("text!ext/language/outline2.xml");

module.exports = ext.register("ext/language/outline2", {
    name    : "Docked Outline",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    nodes   : [],
    alone   : true,
    worker  : null,
    fullOutline : [],
    markup  : markup,
    _name: "ext/language/outline2",
    
    hook: function() {
        var _self = this;


        commands.addCommand({
            name: "outline",
            hint: "search for a definition and jump to it",
            bindKey: {mac: "Command-Shift-E", win: "Ctrl-Shift-E"},
            isAvailable : function(editor) {
                return editor && editor.path == "ext/code/code";
            },
            exec: function () {
                _self.updateOutline(true);
            }
        });
        
        var mnuItem = new apf.item({
            command : "outline"
        });

        this.nodes.push(
            menus.addItemByPath("Tools/Quick Outline", mnuItem, 100),
            menus.addItemByPath("Goto/Goto Definition...", mnuItem.cloneNode(false), 110)
        );

        dock.addDockable({
            expanded : -1,
            width : 220,
            "min-width" : 200,
            barNum: 2,
            sections : [{
                width : 220,
                height: 300,
                buttons : [{
                    caption: "Outline",
                    ext : [this._name, "pgOutline"],
                    hidden : false
                }]
            }]
        });

        dock.register(this._name, "pgOutline", {
            menu : "Outline",
            primary : {
                backgroundImage: "images/main_icon.png",
                defaultState: { x: -6, y: 0 },
                activeState:  { x: -6, y: -40 }
            }
        }, function() {
            ext.initExtension(_self);
            return pgOutline;
        });
    },

    init: function () {
        tbOutlineSearch.addEventListener("afterchange", function(e) {
            _self.onAfterChange(e);
        }, true);
    },

    setWorker: function (worker) {
        this.worker = worker;
        var _self = this;
        worker.on("outline", function(e) {
            ext.initExtension(_self);
            _self.openOutline(e);
        });
    },

    _getDockBar: function () {
        return dock.getBars(this._name, "pgOutline")[0];
    },

    outlineJsonToXml: function(array, selected, tag) {
        var xmlS = [];
        for (var i = 0; i < array.length; i++) {
            var elem = array[i];
            var pos = elem.displayPos || elem.pos;
            xmlS.push(util.toXmlTag(tag, {
                name: elem.name.replace(/"/g, "''"),
                icon: elem.icon || "method",
                sl: pos.sl,
                el: pos.el,
                sc: pos.sc,
                ec: pos.ec,
                elx: elem.pos.el,
                meta: elem.meta,
                selected: elem === selected ? "true" : "false"
            }, true));
            xmlS = xmlS.concat(this.outlineJsonToXml(elem.items, selected, 'entry'));
            xmlS.push('</'); xmlS.push(tag); xmlS.push('>');
        }
        return xmlS.join('');
    },

    findCursorInOutline: function(json, cursor) {
        for (var i = 0; i < json.length; i++) {
            var elem = json[i];
            if(cursor.row < elem.pos.sl || cursor.row > elem.pos.el)
                continue;
            var inChildren = this.findCursorInOutline(elem.items, cursor);
            return inChildren ? inChildren : elem;
        }
        return null;
    },

    openOutline : function(event) {
        var data = event.data;
        if (data.error) {
            // TODO: show error in outline?
            console.log("Oh noes! " + data.error);
            return;
        }

        var editor = editors.currentEditor;
        if (!editor || editor.path != "ext/code/code")
            return;

        this.fullOutline = event.data.body;
        var ace = editor.amlEditor.$editor;
        var cursor = ace.getCursorPosition();

        this.renderOutline(event.data.showNow);

        this.showOutline();
    },

    showOutline: function() {
        var bar = dock.getBars(this._name, "pgOutline")[0];
        dock.showBar(bar);
        dock.expandBar(bar);
        dock.showSection(this._name, "pgOutline");
    },

    renderOutline: function(ignoreFilter) {
        var editor = editors.currentEditor;
        if (!editor || editor.path != "ext/code/code")
            return;
            
        var filter = ignoreFilter ? "" : tbOutlineSearch.value;
        this.isDirty = ignoreFilter;
        this.isKeyDownAfterDirty = false;

        var outline = this.filteredOutline = search.treeSearch(this.fullOutline, filter, true);

        var ace = editor.amlEditor.$editor;
        var selected = this.findCursorInOutline(outline, ace.getCursorPosition());
        mdlOutline2.load(apf.getXml('<data>' + this.outlineJsonToXml(outline, selected, 'entries') + '</data>'));
        return selected;
    },

    jumpTo: function(el) {
        setTimeout(function() {
            var editor = editors.currentEditor.amlEditor.$editor;
            var range = new Range(+el.getAttribute("sl"), 0, +el.getAttribute("el"), Infinity);
            editor.selection.setSelectionRange(range);
            editor.centerSelection();
        });
    },

    onAfterChange: function(event) {
        this.renderOutline();
        this.scrollToTop(true);
    },

    scrollToTop: function(selectFirstItem) {
        if (selectFirstItem && mdlOutline2.data.childNodes[0] && mdlOutline2.data.childNodes[0].nodeType === 1) {
            treeOutlineDocked.select(mdlOutline2.data.childNodes[0]);
        }
        // HACK: Need to set to non-falsy values first
        treeOutlineDocked.$container.scrollTop = 2;
        treeOutlineDocked.$container.scrollTop = 1;
        treeOutlineDocked.$container.scrollTop = 0;
    }
});

});
