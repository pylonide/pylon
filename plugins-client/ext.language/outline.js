/**
 * Module that implements outlines
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var gotofile = require("ext/gotofile/gotofile");
var search = require("ext/gotofile/search");

module.exports = {
    nodes: [],
    cachedOutlineTree : [],
    
    hook: function(oExt, worker) {
        this.worker = worker;
        var _self = this;
        
        worker.on("outline", function(event) {
            _self.openOutline(event);
        }); 
        
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

        this.nodes.push(
            menus.addItemByPath("View/Outline", mnuItem, 190),
            // menus.addItemByPath("File/Open definition...", mnuItem.cloneNode(false), 500),
            menus.addItemByPath("Goto/Goto Definition...", mnuItem.cloneNode(false), 110)
        );
        
        ide.addEventListener("init.ext/gotofile/gotofile", function(e) {
            dgGoToFile.parentNode.insertBefore(treeOutline, dgGoToFile);
            txtGoToFile.addEventListener("afterchange", function(e) {
                // TODO: only call fetchOutline() when necessary
                if (gotofile.isOutlineEnabled())
                    _self.fetchOutline(false);
            });
        });
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

    openOutline : function(event) {
        var data = event.data;
        if (data.error) {
            // TODO: show error in outline?
            console.log("Oh noes! " + data.error);
            return;
        }
        
        if (event.data.showNow) {
            gotofile.toggleDialog(1);
            //if (!txtGoToFile.value.match(/^@/))
            //    txtGoToFile.setValue("@");
            //txtGoToFile.$input.selectionStart = 1;
            dgGoToFile.hide();
            treeOutline.show();
        }
        //gotofile.setOutline(data.body, this.renderOutline);
        this.cachedOutlineTree = event.data.body;
        this.renderOutline();
    },
    
    renderOutline : function() {
        var outline = this.cachedOutlineTree;
        if (outline.items)
            outline = outline.items;
        var ace = editors.currentEditor.amlEditor.$editor;
        
        //barOutline.setAttribute('visible', true);
        var selected = this.findCursorInOutline(outline, ace.getCursorPosition());
        mdlOutline.load(apf.getXml('<data>' + this.outlineJsonToXml(outline, selected, 'entries') + '</data>'));
        
        var node = mdlOutline.queryNode("//entry[@selected]");
        if(node) {
            treeOutline.select(node);
            var htmlNode = apf.xmldb.getHtmlNode(node, treeOutline);
            htmlNode.scrollIntoView();
        }
        //document.addEventListener("click", this.closeOutline);
        ace.container.addEventListener("DOMMouseScroll", this.closeOutline);
        ace.container.addEventListener("mousewheel", this.closeOutline);
    },
    
    filterOutline : function() {
        // TODO
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
