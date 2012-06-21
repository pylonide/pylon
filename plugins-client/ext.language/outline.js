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
    fullOutline : [],
    ignoreSelectOnce : true,
    isDirty : false,
    
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
        
        ide.addEventListener("init.ext/gotofile/gotofile", function() {
            var selStart, selEnd;
            
            dgGoToFile.parentNode.insertBefore(treeOutline, dgGoToFile);
            txtGoToFile.addEventListener("afterchange", function(e) {
                _self.onAfterChange(e);
            }, true);            
            txtGoToFile.addEventListener("keydown", function(e) {
                _self.onKeyDown(e);
            });
            txtGoToFile.addEventListener("keyup", function(e) {
                _self.onKeyUp(e);
            });
            winGoToFile.addEventListener("prop.visible", function(e) {
                if (!e.value)
                    _self.showFileSearch();
            });
            treeOutline.addEventListener("onafterselect", function() {
                _self.onSelect(treeOutline.selected);
            });
            treeOutline.addEventListener("onafterchoose", function() {
                setTimeout(gotofile.toggleDialog(-1), 500);
            });
            txtGoToFile.addEventListener("blur", function() {
                selStart = txtGoToFile.$input.selectionStart;
                selEnd = txtGoToFile.$input.selectionEnd;
            });
            treeOutline.addEventListener("focus", function() {
                txtGoToFile.focus();
                if (selStart && selEnd) {
                    txtGoToFile.$input.selectionStart = selStart;
                    txtGoToFile.$input.selectionEnd = selEnd;
                }
            });
        });   

    },

    outlineJsonToXml: function(array, selected, tag) {
        var xmlS = [];
        for (var i = 0; i < array.length; i++) {
            var elem = array[i];
            var pos = elem.displayPos || elem.pos;
            xmlS.push('<'); xmlS.push(tag); xmlS.push(' name="'); xmlS.push(elem.name);
                xmlS.push('" icon="' + (elem.icon || "method"));
                xmlS.push('" sl="'); xmlS.push(pos.sl);
                xmlS.push('" el="'); xmlS.push(pos.el);
                xmlS.push('" sc="'); xmlS.push(pos.sc);
                xmlS.push('" ec="'); xmlS.push(pos.ec);
                xmlS.push('" elx="'); xmlS.push(elem.pos.el);
            elem.meta && xmlS.push('" meta="') && xmlS.push(elem.meta);
                elem === selected && xmlS.push('" selected="true');
                xmlS.push('">\n');
            xmlS = xmlS.concat(this.outlineJsonToXml(elem.items, selected, 'entry'));
                xmlS.push('</'); xmlS.push(tag); xmlS.push('>');
        }
        return xmlS.join('');
    },
    
    updateOutline : function(showNow) {
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
        
        this.fullOutline = event.data.body;
        this.renderOutline(event.data.showNow);
        
        if (event.data.showNow) {
            gotofile.toggleDialog(1);
            this.showOutline();
            txtGoToFile.$input.selectionStart = 1;
        }
        else if (txtGoToFile.value.match(/^@/)) {
            this.showOutline();
        }
    },
    
    showOutline: function() {
        gotofile.setEventsEnabled(false);
        if (!dgGoToFile.getProperty("visible"))
            return;
        if (!txtGoToFile.value.match(/^@/))
            txtGoToFile.setValue("@");
        else
            txtGoToFile.setValue(txtGoToFile.value);
        this.ignoreSelectOnce = true;
        dgGoToFile.hide();
        treeOutline.show();
    },
    
    showFileSearch: function() {
        gotofile.setEventsEnabled(true);
        if (dgGoToFile.getProperty("visible"))
            return;
        dgGoToFile.show();
        treeOutline.hide();
    },
    
    renderOutline: function(ignoreFilter) {
        require("core/ext").initExtension(gotofile);
        var filter = ignoreFilter ? "" : txtGoToFile.value.substr(1);
        this.isDirty = ignoreFilter;
        var outline = search.treeSearch(this.fullOutline, filter);
        if (outline.items)
            outline = outline.items;
        var ace = editors.currentEditor.amlEditor.$editor;
        
        var selected = this.findCursorInOutline(outline, ace.getCursorPosition());
        mdlOutline.load(apf.getXml('<data>' + this.outlineJsonToXml(outline, selected, 'entries') + '</data>'));
        
        var node = mdlOutline.queryNode("//entry[@selected]");
        if (node) {
            this.ignoreSelectOnce = true;
            treeOutline.select(node);
            var htmlNode = apf.xmldb.getHtmlNode(node, treeOutline);
            htmlNode.scrollIntoView();
        }
    },

    onSelect: function(el) {
        if (this.ignoreSelectOnce) {
            this.ignoreSelectOnce = false;
            return;
        }
        var editor = editors.currentEditor.amlEditor.$editor;
        var range = new Range(+el.getAttribute("sl"), +el.getAttribute("sc"),
            +el.getAttribute("el"), +el.getAttribute("ec"));
        this.scrollToDefinition(editor, +el.getAttribute("sl"), +el.getAttribute("elx") || +el.getAttribute("el"));
        editor.selection.setSelectionRange(range);
    },
    
    scrollToDefinition: function(editor, line, lineEnd) {
        var lineHeight = editor.renderer.$cursorLayer.config.lineHeight;
        var lineVisibleStart = editor.renderer.scrollTop / lineHeight
        var linesVisible = editor.renderer.$size.height / lineHeight;
        lineEnd = Math.min(lineEnd, line + linesVisible);
        if (lineVisibleStart <= line && lineEnd <= lineVisibleStart + linesVisible)
            return; 
        editor.scrollToLine((line + lineEnd) / 2 - 1, true);  
    },
    
    onKeyDown: function(e) {
        if (gotofile.eventsEnabled)
            return;
            
        if (e.keyCode === 27) { // Escape
            gotofile.toggleDialog(-1);
        }
        else if (e.keyCode === 13) { // Enter
            gotofile.toggleDialog(-1);
        }
        else if (e.keyCode === 40) { // Down
            e.preventDefault();
            delete e.currentTarget;
            treeOutline.dispatchEvent("keydown", e);
            return;
        }
        else if (e.keyCode === 38) { // Up
            e.preventDefault();
            delete e.currentTarget;
            treeOutline.dispatchEvent("keydown", e);
            return;
        }
        else if (this.isDirty) {
            this.renderOutline();
        }
    },
    
    onKeyUp: function(e) {
        if (e.keyCode === 50) // @
            this.updateOutline();
    },
    
    getNodeAfter: function(node) {
        if (node.childNodes[1] && treeOutline.isCollapsed(node.childNodes[1])) {
            return node.childNodes[1];
        } else {
            while (!node.nextSibling && node.parentNode)
                node = node.parentNode;
            return node.nextSibling;
        }
    },
    
    getNodeBefore: function(node) {
        if (node.previousSibling && node.previousSibling.attributes) {
            node = node.previousSibling;
            while (node.childNodes[1] && treeOutline.isCollapsed(node.childNodes[1]))
                node = node.childNodes[1];
            return node;
        } else {
            return node.parentNode == treeOutline.root ? null : node.parentNode;
        }
    },
    
    onAfterChange: function(event) {
        if (txtGoToFile.value === "@") 
            this.ignoreSelectOnce = true;
            
        if (txtGoToFile.value.match(/^@/)) {
            this.updateOutline();
            gotofile.setEventsEnabled(false);
        }
        else {
            this.showFileSearch();
        }
        this.renderOutline();
    },
};
});

