/**
 * Refactor Module for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/save/save",
    ["core/ide", "core/ext", "core/util", "ext/filesystem/filesystem", "text!ext/save/save.xml"],
    function(ide, ext, util, fs, markup) {

return ext.register("ext/save/save", {
    dev     : "Ajax.org",
    name    : "Save",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    deps    : [fs],
    hotkeys : {"quicksave":1, "saveas":1},
    hotitems: {},

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
                e.preventDefault();
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
                onclick : _self.quicksave
            }), ide.mnuFile.firstChild)
            //ide.mnuFile.insertBefore(new apf.divider(), ide.mnuFile.childNodes[1])
        );

        this.hotitems["quicksave"] = [this.nodes[this.nodes.length - 1]];
    },

    quicksave : function(page) {
        if (!page || !page.$at)
            page = tabEditors.getPage();

        if (!page)
            return;

        var node = page.$model.data;
        if (node.getAttribute("debug"))
            return;

        var path = node.getAttribute("path");
        var data = apf.queryValue(node, "data");
        if (apf.queryValue(node, "data/@newline") == "windows")
            data = data.replace(/\r?\n/g, "\r\n");
        else
            data = data.replace(/\r?\n/g, "\n");

        var _self = this, panel = sbMain.firstChild;
        panel.setAttribute("caption", "Saving file " + path);
        fs.saveFile(path, data, function(data, state, extra){
            if (state != apf.SUCCESS) {
                util.alert(
                    "Could not save document",
                    "An error occurred while saving this document",
                    "Please see if your internet connection is available and try again. "
                        + (state == apf.TIMEOUT
                            ? "The connection timed out."
                            : "The error reported was " + e.message));
            }
            
            panel.setAttribute("caption", "Saved file " + path);
            setTimeout(function(){
                if (panel.caption == "Saved file " + path)
                    panel.removeAttribute("caption");
            }, 500);
        });
        
        page.$at.reset(); //@todo this sucks... please fix
        return false;
    },

    saveas : function() {
        //console.log("saveas called...");
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