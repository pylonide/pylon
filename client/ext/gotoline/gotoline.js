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
        this.txtLinenr = txtLineNr;//winGotoLine.selectSingleNode("a:vbox/a:hbox/a:textbox[1]");
        //buttons
        this.btnGo = btnLinGo;//winGotoLine.selectSingleNode("a:vbox/a:hbox/a:button[1]");
        this.btnGo.onclick = this.gotoLine.bind(this);
    },

    toggleDialog: function(forceShow) {
        ext.initExtension(this);

        if (!winGotoLine.visible || forceShow)
            winGotoLine.show();
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

    gotoLine: function() {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;            
        this.$editor.gotoLine(parseInt(this.txtLinenr.getValue()) || 0);
        winGotoLine.hide();
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