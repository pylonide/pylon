/**
 * Outline support.
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("core/settings");
var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var gotofile = require("ext/gotofile/gotofile");
var search = require("ext/gotofile/search");
var outline;

module.exports = {
    nodes: [],
    fullOutline : [],
    filteredOutline : [],
    ignoreSelectOnce : false,
    isDirty : false,
    isKeyDownAfterDirty : false,
    lastGoToFileText : "",
    lastOutlineText : "@",
    
    hook: function(oExt, worker) {
        this.worker = worker;
        var _self = this;
        outline = oExt;
        
        worker.on("outline", function(event) {
            _self.openOutline(event);
        }); 
        
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
            treeOutline.addEventListener("onafterselect", function() {
                _self.onSelect(treeOutline.selected);
            });
            treeOutline.addEventListener("onafterchoose", function() {
                _self.ignoreSelectOnce = false;
                _self.onSelect(treeOutline.selected);
                gotofile.toggleDialog(-1);
            });
            treeOutline.addEventListener("click", function(e) {
                _self.ignoreSelectOnce = false;
                _self.onSelect(treeOutline.selected);
                var COLLAPSE_AREA = 14;
                if (e.htmlEvent.x >= treeOutline.$container.getClientRects()[0].left + 14)
                    gotofile.toggleDialog(-1);
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
            winGoToFile.addEventListener("prop.visible", function(e) {
                if (!e.value)
                    _self.showGoToFile();
            });
            var editor = editors.currentEditor.amlEditor.$editor;
            
            treeOutline.bufferselect = false;
        });   

    },

    outlineJsonToXml: function(array, selected, tag) {
        var xmlS = [];
        for (var i = 0; i < array.length; i++) {
            var elem = array[i];
            var pos = elem.displayPos || elem.pos;
            xmlS.push('<'); xmlS.push(tag); xmlS.push(' name="'); xmlS.push(elem.name.replace(/"/g, "''"));
                xmlS.push('" icon="' + (elem.icon || "method"));
                xmlS.push('" sl="'); xmlS.push(pos.sl);
                xmlS.push('" el="'); xmlS.push(pos.el);
                xmlS.push('" sc="'); xmlS.push(pos.sc);
                xmlS.push('" ec="'); xmlS.push(pos.ec);
                xmlS.push('" elx="'); xmlS.push(elem.pos.el);
            elem.meta && xmlS.push('" meta="') && xmlS.push(elem.meta);
                if (elem === selected)
                    xmlS.push('" selected="true');
                xmlS.push('">\n');
            xmlS = xmlS.concat(this.outlineJsonToXml(elem.items, selected, 'entry'));
                xmlS.push('</'); xmlS.push(tag); xmlS.push('>');
        }
        return xmlS.join('');
    },
    
    updateOutline : function(showNow, ignoreInputText) {
        this.showOutline(showNow, ignoreInputText);
        /* TODO: set loading message if file has changed
        treeOutline.$setClearMessage(treeOutline["loading-message"], "loading");
        apf.setOpacity(winGoToFile.$ext, 1);
        */
        this.worker.emit("outline", { data : { ignoreFilter: showNow } });
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
        if (!editor || editor.path != "ext/code/code" || !editor.amlEditor)
            return;
        
        this.fullOutline = event.data.body;
        var ace = editor.amlEditor.$editor;
        var cursor = ace.getCursorPosition();
        this.$originalLine = cursor.row + 1;
        this.$originalColumn = cursor.column;
        
        // var selected = this.renderOutline(event.data.showNow);
        this.renderOutline(event.data.showNow);
        
        if (txtGoToFile.value.match(/^@/))
            this.showOutline();

        // UNDONE: Scroll to selected
        // if (event.data.showNow)
        //     this.scrollToSelected(selected);
    },
    
    /**
     * Show the outline view in the goto dialog,
     * instead of the file list.
     */
    showOutline: function(makeVisible, ignoreInputText) {
        ext.initExtension(outline);
        ext.initExtension(gotofile);
        if (makeVisible) {
            gotofile.toggleDialog(1);
            txtGoToFile.focus();
            this.showOutline();
            if (txtGoToFile.value.length > 0)
                txtGoToFile.$input.selectionStart = 1;
            this.scrollToTop();
        }
        gotofile.setEventsEnabled(false);
        if (!dgGoToFile.getProperty("visible"))
            return;
        if (!txtGoToFile.value.match(/^@/) && !ignoreInputText) {
            this.lastGoToFileText = txtGoToFile.value;
            txtGoToFile.setValue(this.lastOutlineText);
        }
        this.ignoreSelectOnce = true;
        dgGoToFile.hide();
        treeOutline.show();
        if (makeVisible)
            txtGoToFile.$input.selectionStart = 1;
    },
    
    showGoToFile: function() {
        gotofile.setEventsEnabled(true);
        if (dgGoToFile.getProperty("visible"))
            return;
        if (txtGoToFile.value.match(/^@/)) {
            this.lastOutlineText = txtGoToFile.value;
            txtGoToFile.setValue(this.lastGoToFileText);
        }
        gotofile.filter(txtGoToFile.value, false, true);
        dgGoToFile.show();
        treeOutline.hide();
    },
    
    renderOutline: function(ignoreFilter) {
        var editor = editors.currentEditor;
        if (!editor || editor.path != "ext/code/code" || !editor.amlEditor)
            return;
            
        ext.initExtension(gotofile);
        var filter = ignoreFilter ? "" : txtGoToFile.value.substr(1);
        this.isDirty = ignoreFilter;
        this.isKeyDownAfterDirty = false;
        
        var outline = this.filteredOutline = search.treeSearch(this.fullOutline, filter, true);

        /* TODO: set "empty" message
        if (outline.length === 0)
            treeOutline.clear(treeOutline["empty-message"], "empty");
        else
            treeOutline.$removeClearMessage();
        */

        var ace = editor.amlEditor.$editor;
        var selected = this.findCursorInOutline(outline, ace.getCursorPosition());
        mdlOutline.load(apf.getXml('<data>' + this.outlineJsonToXml(outline, selected, 'entries') + '</data>'));
        return selected;
    },
    
    scrollToSelected: function(selected) {
        var node = mdlOutline.queryNode("//*[@selected]");
        if (node) {
            this.ignoreSelectOnce = true;
            treeOutline.select(node);
            var htmlNode = apf.xmldb.getHtmlNode(node, treeOutline);
            htmlNode.scrollIntoView();
        }
        else {
            this.scrollToTop();
        }
    },
    
    scrollToTop: function(selectFirstItem) {
        if (selectFirstItem && mdlOutline.data.childNodes[0] && mdlOutline.data.childNodes[0].nodeType === 1) {
            treeOutline.select(mdlOutline.data.childNodes[0]);
        }
        // HACK: Need to set to non-falsy values first
        treeOutline.$container.scrollTop = 2;
        treeOutline.$container.scrollTop = 1;
        treeOutline.$container.scrollTop = 0;
    },

    onSelect: function(el) {
        if (gotofile.eventsEnabled || !el)
            return;
            
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
        var SAFETY = 1.5;
        editor.scrollToLine(Math.round((line + lineEnd) / 2 - SAFETY), true);
    },
    
    onKeyDown: function(e) {
        if (gotofile.eventsEnabled)
            return;
            
        if (e.keyCode === 27) { // Escape
            if (this.$originalLine) {
                var editor = editors.currentEditor;
                var ace = editor.amlEditor.$editor;
                ace.gotoLine(this.$originalLine, this.$originalColumn, apf.isTrue(settings.model.queryValue("editors/code/@animatedscroll")));
                
                delete this.$originalLine;
                delete this.$originalColumn;
            }
            gotofile.toggleDialog(-1);
        }
        else if (e.keyCode === 13) { // Enter
            this.ignoreSelectOnce = false;
            this.onSelect(treeOutline.selected);
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
            this.isKeyDownAfterDirty = true;
        }
    },
    
    onKeyUp: function(e) {
        if (e.keyCode === 50) { // @
            this.updateOutline(false, true);
        }
        else if (this.isDirty && this.isKeyDownAfterDirty) {
            this.renderOutline();
            this.scrollToTop(true);
            this.isDirty = false;
        }
    },
    
    onAfterChange: function(event) {
        if (txtGoToFile.value.match(/^@/)) {
            this.updateOutline();
            gotofile.setEventsEnabled(false);
        }
        else {
            this.showGoToFile();
        }
        this.renderOutline();
        this.scrollToTop(true);
    }
};
});
