/**
 * Searchreplace Module for the Ajax.org Cloud IDE
 */
require.def("ext/searchreplace/searchreplace",
    ["core/ide",
     "core/ext",
     "ace/PluginManager",
     "text!ext/searchreplace/searchreplace.xml"],
    function(ide, ext, plugins, markup) {

return ext.register("ext/searchreplace/searchreplace", {
    name    : "Searchreplace",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    hotkeys : {"searchreplace":1},
    hotitems: {},
    
    nodes   : [],
    
    init : function(amlNode){
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Search & Replace",
                onclick : this.toggleDialog.bind(this)
            }))
        );

        this.hotitems["searchreplace"] = this.nodes[1];

        this.txtFind       = winSearchReplace.selectSingleNode("//a:textbox[1]");
        this.txtReplace    = winSearchReplace.selectSingleNode("//a:textbox[2]");
        //buttons
        this.btnReplace    = winSearchReplace.selectSingleNode("//a:button[1]");
        this.btnReplace.onclick = this.replace.bind(this);
        this.btnReplaceAll = winSearchReplace.selectSingleNode("//a:button[2]");
        this.btnReplaceAll.onclick = this.replaceAll.bind(this);
        this.btnClose      = winSearchReplace.selectSingleNode("//a:button[3]");
        this.btnClose.onclick = this.toggleDialog.bind(this);
        this.btnFind       = winSearchReplace.selectSingleNode("//a:button[4]");
        this.btnFind.onclick = this.findNext.bind(this);
    },

    toggleDialog: function() {
        if (!winSearchReplace.visible)
            winSearchReplace.show();
        else
            winSearchReplace.hide();
    },

    findNext: function() {
        //
    },

    replace: function() {
        //
    },

    replaceAll: function() {
        //
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