/**
 * Refactor Module for the Ajax.org Cloud IDE
 */
require.def("ext/save/save",
    ["core/ide", "core/ext", "core/util", "ext/tree/tree", "text!ext/save/save.xml"],
    function(ide, ext, util, tree, markup) {

return ext.register("ext/save/save", {
    dev    : "Ajax.org",
    name   : "Save",
    alone  : true,
    type   : ext.GENERAL,
    markup : markup,
    deps   : [tree],

    nodes : [],

    init : function(amlNode){

        function save(page){
            if (!page.$at)
                page = ide.tabEditors.getPage();

            if (!page)
                return;

            tree.saveFile(page.$model.data);
            page.$at.reset();
        }

        winCloseConfirm.onafterrender = function(){
            btnSaveYes.addEventListener("click", function(){
                var page = winCloseConfirm.page;
                save(page);
                ide.tabEditors.remove(page);

                delete winCloseConfirm.page;
                winCloseConfirm.hide()
            });
            btnSaveNo.addEventListener("click", function(){
                var page = winCloseConfirm.page;
                page.$at.undo(-1);

                ide.tabEditors.remove(page);
                delete winCloseConfirm.page;
                winCloseConfirm.hide();
            });
            btnSaveCancel.addEventListener("click", function(){
                winCloseConfirm.hide();
            });
        }

        ide.tabEditors.addEventListener("close", this.$close = function(e){
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

        btnSave.onclick = save;

        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Save",
                onclick : save
            }), ide.mnuFile.firstChild)
        );
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

        ide.tabEditors.removeEventListener("close", this.$close);
    }
});

    }
);