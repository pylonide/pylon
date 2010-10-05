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
    name    : "Gotoline",
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
        this.txtLineNr = txtLineNr;
        //buttons
        this.btnGo = btnLinGo;
        this.btnGo.onclick = this.gotoLine.bind(this);
        var _self = this;
        lstLineNumber.onafterchoose = function() {
            if (lstLineNumber.selected) {
                console.log();
                _self.gotoLine(parseInt(lstLineNumber.selected.getAttribute("nr")));
            }
            else
                _self.gotoLine();
        }
        this.txtLineNr.onkeydown = function(e) {
            if (e.keyCode == 40) {
                var first = lstLineNumber.getFirstTraverseNode();
                if (first) {
                    lstLineNumber.select(first);
                    lstLineNumber.focus();
                }
            };
        };
    },

    toggleDialog: function(forceShow) {
        ext.initExtension(this);

        if (!winGotoLine.visible || forceShow) {
            editorPage = tabEditors.getPage();
            if (!editorPage) return;

            var model = editorPage.$model;
            apf.createNodeFromXpath(model.data, "gotoline");
            lstLineNumber.setAttribute("model", editorPage.$model);
            winGotoLine.show();
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
            line = parseInt(this.txtLineNr.getValue()) || 0;

        var history = lstLineNumber.$model;
        var lineEl = history.queryNode("gotoline/line[@nr='" + line + "']");
        if (lineEl)
            apf.xmldb.setAttribute(lineEl, "ts", Date.now());
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