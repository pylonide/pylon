/**
 * Module that implements outlines
 */
define(function(require, exports, module) {

var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var ide = require("core/ide");
var menus = require("ext/menus/menus");

module.exports = {
    hook: function(ext, worker) {
        var _self = this;
        
        worker.on("outline", function(event) {
            _self.renderOutline(event);
        });

        ext.nodes.push(
            menus.addItemByPath("View/Outline", new apf.item({
                onclick: function() {
                    worker.emit("outline", {data: {}});
                }
            }))
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
                xmlS.push('" sc="'); xmlS.push(elem.pos.sc)
                xmlS.push('" ec="'); xmlS.push(elem.pos.ec);
            elem.meta && xmlS.push('" meta="') && xmlS.push(elem.meta);
                elem === selected && xmlS.push('" selected="true');
                xmlS.push('">\n');
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

    renderOutline : function(event) {
        var ace = editors.currentEditor.amlEditor.$editor;
        var data = event.data;
        if (data.error) {
            // TODO pop up an error dialog
            return;
        }
        var outline = data.body;
        
        barOutline.setAttribute('visible', true);
        var selected = this.findCursorInOutline(outline, ace.getCursorPosition());
        mdlOutline.load(apf.getXml('<data>' + this.outlineJsonToXml(outline.items, selected, 'entries') + '</data>'));
        
        var node = mdlOutline.queryNode("//entry[@selected]");
        if(node) {
            treeOutline.select(node);
            var htmlNode = apf.xmldb.getHtmlNode(node, treeOutline);
            htmlNode.scrollIntoView();
        }
        //document.addEventListener("click", this.closeOutline);
        ace.container.addEventListener("DOMMouseScroll", this.closeOutline);
        ace.container.addEventListener("mousewheel", this.closeOutline);

        apf.popup.setContent("outline", barOutline.$ext);
        setTimeout(function() {
            apf.popup.show("outline", {
                x        : editors.currentEditor.amlEditor.getWidth()/2 - 150,
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