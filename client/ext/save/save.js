/**
 * Refactor Module for the Ajax.org Cloud IDE
 */
require.def("ext/save/save",
    ["core/ide", "core/ext", "core/util", "ext/tree/tree", "text!ext/save/save.xml"],
    function(ide, ext, util, tree, markup) {

return ext.register("ext/save/save", {
    dev     : "Ajax.org",
    name    : "Save",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    deps    : [tree],
    hotkeys : {"quicksave":1, "saveas":1},
    hotitems: [],

    nodes   : [],

    init : function(amlNode){
        var _self = this;

        winCloseConfirm.onafterrender = function(){
            btnSaveYes.addEventListener("click", function(){
                var page = winCloseConfirm.page;
                _self.quicksave(page);
                tabEditors.remove(page);

                delete winCloseConfirm.page;
                winCloseConfirm.hide()
            });
            btnSaveNo.addEventListener("click", function(){
                var page = winCloseConfirm.page;
                page.$at.undo(-1);

                tabEditors.remove(page);
                delete winCloseConfirm.page;
                winCloseConfirm.hide();
            });
            btnSaveCancel.addEventListener("click", function(){
                winCloseConfirm.hide();
            });
        }

        tabEditors.addEventListener("close", this.$close = function(e){
            if (e.page.$at.undolength) {
                winCloseConfirm.page = e.page;
                winCloseConfirm.show();
                return false;
            }
        });

        var nodes = barSave.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            this.nodes.push(ide.barTools.appendChild(nodes[0]));
        }

        btnSave.onclick = _self.quicksave;
        
        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Save",
                hotkey  : "Ctrl-S",
                onclick : _self.quicksave
            }), ide.mnuFile.firstChild)
            //ide.mnuFile.insertBefore(new apf.divider(), ide.mnuFile.childNodes[1])
        );
    },

    quicksave : function(page) {
        console.log("quicksave called...");
        if (!page || !page.$at)
            page = tabEditors.getPage();

        if (!page)
            return;

        tree.saveFile(page.$model.data);
        page.$at.reset();
        return false;
    },

    saveas : function() {
        console.log("saveas called...");
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

        tabEditors.removeEventListener("close", this.$close);
    }
});

    }
);