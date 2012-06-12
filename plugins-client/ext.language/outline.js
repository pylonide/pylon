/**
 * Module that implements outlines
 */
define(function(require, exports, module) {

var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var ide = require("core/ide");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var gotofile = require("ext/gotofile/gotofile");

module.exports = {
    hook: function(ext, worker) {
        this.worker = worker;
        var _self = this;
        
        worker.on("outline", function(event) {
            _self.renderOutline(event);
        }); 
        
        // TODO: properly register this event listener
        // TODO: only call fetchOutline() once
        var setListener = function() {
            if (typeof txtGoToFile === "undefined") {
                setTimeout(setListener, 1000);
                return;
            }
            txtGoToFile.addEventListener("afterchange", function(e) {
                if (txtGoToFile.value.match(/^@/))
                    _self.fetchOutline(false);
            });
        };
        setListener();               
        commands.addCommand({
            name: "outline",
            hint: "search for a definition and jump to it",
            bindKey: {mac: "Command-Shift-E", win: "Ctrl-Shift-E"},
            isAvailable : function(editor) {
                return editor && editor.ceEditor;
            },
            exec: function () {
                _self.fetchOutline(true);
            }
        });

        var mnuItem = new apf.item({
            command : "outline"
        });

        ext.nodes.push(
            menus.addItemByPath("View/Outline", mnuItem)
        );
    },

    outlineJsonToXml: function(array, selected, tag) {
        var xmlS = [];
        for (var i = 0; i < array.length; i++) {
            var elem = array[i];
            xmlS.push('<'); xmlS.push(tag); xmlS.push(' name="'); xmlS.push(elem.name);
                xmlS.push('" icon="' + elem.icon);
                xmlS.push('" sl="'); xmlS.push(elem.pos.sl);
                xmlS.push('" el="'); xmlS.push(elem.pos.el);
                xmlS.push('" sc="'); xmlS.push(elem.pos.sc);
                xmlS.push('" ec="'); xmlS.push(elem.pos.ec);
            elem.meta && xmlS.push('" meta="') && xmlS.push(elem.meta);
                elem === selected && xmlS.push('" selected="true');
                xmlS.push('">\n');
            xmlS = xmlS.concat(this.outlineJsonToXml(elem.items, selected, 'entry'));
                xmlS.push('</'); xmlS.push(tag); xmlS.push('>');
        }
        return xmlS.join('');
    },
    
    fetchOutline : function(showNow) {
        this.worker.emit("outline", { data : { showNow: showNow } });
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

    renderOutline : function(event) {
        var ace = editors.currentEditor.amlEditor.$editor;
        var data = event.data;
        if (data.error) {
            // TODO: show error in outline?
            console.log("Oh noes! " + data.error);
            return;
        }
        var results = [];
        this.extractResults(data, results);
        
        if (event.data.showNow) {
            gotofile.toggleDialog(1);
            if (!txtGoToFile.value.match(/^@/))
                txtGoToFile.setValue("@");
            txtGoToFile.$input.selectionStart = 1;
        }
        gotofile.setOutlineData(results);
    },
    
    extractResults: function(outlineItem, results) {
        if (outlineItem.name)
            results.push("@" + outlineItem.name);
        var body = outlineItem.body;
        if (!body)
            return;
        for (var i = 0; i < body.length; i++)
            this.extractResults(body[i], results);
        
    },

    jumpTo: function(el) {
        setTimeout(function() {
            var editor = editors.currentEditor.amlEditor.$editor;
            var range = new Range(+el.getAttribute("sl"), +el.getAttribute("sc"),
                +el.getAttribute("el"), +el.getAttribute("ec"));
            editor.selection.setSelectionRange(range);
            editor.centerSelection();
        });
    },

    jumpToAndClose: function(el) {
        this.closeOutline();
    },

    closeOutline : function(event) {
        var ace = editors.currentEditor.amlEditor.$editor;
        //document.removeEventListener("click", this.closeOutline);
        ace.container.removeEventListener("DOMMouseScroll", this.closeOutline);
        ace.container.removeEventListener("mousewheel", this.closeOutline);
        barOutline.$ext.style.display = "none";
        setTimeout(function() {
            editors.currentEditor.amlEditor.$editor.focus();
        }, 100);
    },

    escapeOutline: function(event) {
        if(event.keyCode === 27) {
            this.closeOutline();
        }
    }
};
});