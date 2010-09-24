/**
 * Gotoline Module for the Ajax.org Cloud IDE
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
    
    init : function(amlNode){
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Go to Line",
                onclick : this.toggleDialog.bind(this)
            }))
        );

        this.hotitems["gotoline"] = [this.nodes[1]];

        var _self = this;

        this.txtLinenr = winGotoLine.selectSingleNode("a:vbox/a:hbox/a:textbox[1]");
        this.txtLinenr.addEventListener("keydown", function(e) {
            if (e.keyCode == 13)
                _self.gotoLine();
        });
        //buttons
        this.btnClose = winGotoLine.selectSingleNode("a:vbox/a:hbox/a:button[1]");
        this.btnClose.onclick = this.toggleDialog.bind(this);
        this.btnGo = winGotoLine.selectSingleNode("a:vbox/a:hbox/a:button[2]");
        this.btnGo.onclick = this.gotoLine.bind(this);

        plugins.registerCommand("gotoline", function(editor, selection) {
            _self.setEditor(editor, selection).toggleDialog(true);
        });
    },

    toggleDialog: function(forceShow) {
        if (!winGotoLine.visible || forceShow)
            winGotoLine.show();
        else
            winGotoLine.hide();
        return false;
    },

    setEditor: function(editor, selection) {
        this.$editor = editor || ceEditor.$editor;
        this.$selection = selection || this.$editor.getSelection();
        return this;
    },

    gotoLine: function() {
        if (!this.$editor)
            this.setEditor();
        this.$editor.gotoLine(parseInt(this.txtLinenr.getValue()) || 0);
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

    }
);