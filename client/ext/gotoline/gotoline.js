/**
 * Gotoline Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/gotoline/gotoline",
    ["core/ide",
     "core/ext",
     "ace/PluginManager",
     "ace/Search",
     "text!ext/gotoline/gotoline.xml"],
    function(ide, ext, plugins, search, markup) {

return ext.register("ext/gotoline/gotoline", {
    name    : "Gotoline Window",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    hotkeys : {"gotoline":1},
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Go to Line",
                onclick : function(){
                    _self.toggleDialog();
                }
            }))
        );

        this.hotitems["gotoline"] = [this.nodes[1]];

        plugins.registerCommand("gotoline", function(editor, selection) {
            _self.setEditor(editor, selection).toggleDialog(true);
        });
    },

    init : function(amlNode){
        var _self = this;
        lstLineNumber.addEventListener("afterchoose", function() {
            if (lstLineNumber.selected) {
                _self.gotoLine(parseInt(lstLineNumber.selected.getAttribute("nr")));
            }
            else
                _self.gotoLine();
        });
        lstLineNumber.addEventListener("afterselect", function() {
            if (this.selected)
                txtLineNr.setValue(this.selected.getAttribute("nr"));
        });

        var restricted = [38, 40, 36, 35]
        lstLineNumber.addEventListener("keydown", function(e) {
            if (e.keyCode == 13 && this.selected){
                _self.gotoLine(this.selected.getAttribute("nr"));
                return false;
            }
            else if (e.keyCode == 38) {
                if (this.selected == this.getFirstTraverseNode())
                    txtLineNr.focus();
            }
            else if (e.keyCode == 27){
                _self.toggleDialog();
            }
            else if (restricted.indexOf(e.keyCode) == -1)
                txtLineNr.focus();
        }, true);

        txtLineNr.addEventListener("keydown", function(e) {
            if (e.keyCode == 13){
                _self.gotoLine();
                return false;
            }
            else if (e.keyCode == 27){
                _self.toggleDialog();
            }
            else if (e.keyCode == 40) {
                var first = lstLineNumber.getFirstTraverseNode();
                if (first) {
                    lstLineNumber.select(first);
                    lstLineNumber.focus();
                }
            }
            else if ((e.keyCode > 57 || e.keyCode == 32) && (e.keyCode < 96 || e.keyCode > 105))
                return false;
        });
    },

    toggleDialog: function(forceShow) {
        ext.initExtension(this);

        if (!winGotoLine.visible || forceShow) {
            editorPage = tabEditors.getPage();
            if (!editorPage) return;

            var editor = require('ext/editors/editors').currentEditor;
            if (editor && editor.ceEditor)
                txtLineNr.setValue(editor.ceEditor.$editor.getCursorPosition().row); //current line

            winGotoLine.show();
            txtLineNr.focus();
        }
        else
            winGotoLine.hide();
        return false;
    },

    setEditor: function(editor, selection) {
        if (typeof ceEditor == "undefined")
            return this;
        this.$editor = editor || ceEditor.$editor;
        this.$selection = selection || this.$editor.getSelection();
        return this;
    },

    gotoLine: function(line) {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;

        winGotoLine.hide();

        if (typeof line != "number")
            line = parseInt(txtLineNr.getValue()) || 0;

        var history = lstLineNumber.$model;
        var lineEl = history.queryNode("gotoline/line[@nr='" + line + "']");
        if (lineEl)
            apf.xmldb.appendChild(lineEl.parentNode, lineEl, lineEl.parentNode.firstChild);
        else
            history.appendXml("<line nr='" + line + "' ts='" + Date.now() + "'/>", "gotoline");

        this.$editor.gotoLine(line);
    },

    onHide : function() {
        var editor = require('ext/editors/editors').currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.focus();
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});