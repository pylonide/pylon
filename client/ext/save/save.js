/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/save/save",
    ["core/ide", "core/ext", "core/util", "ext/filesystem/filesystem",
            "text!ext/save/save.xml"],
    function(ide, ext, util, fs, markup) {

return ext.register("ext/save/save", {
    dev         : "Ajax.org",
    name        : "Save",
    alone       : true,
    type        : ext.GENERAL,
    markup      : markup,
    deps        : [fs],
    hotkeys     : {"quicksave":1, "saveas":1},
    hotitems    : {},
    nodes       : [],

    init : function(amlNode){
        var _self = this;

        winCloseConfirm.onafterrender = function(){
            btnYesAll.addEventListener("click", function(){
                winCloseConfirm.all = 1;
                winCloseConfirm.hide();
            });
            btnNoAll.addEventListener("click", function(){
                winCloseConfirm.all = -1;
                winCloseConfirm.hide();
            });
            btnSaveYes.addEventListener("click", function(){
                _self.quicksave(winCloseConfirm.page);
                winCloseConfirm.hide()
            });
            btnSaveNo.addEventListener("click", function(){
                winCloseConfirm.hide();
            });
            btnSaveCancel.addEventListener("click", function(){
                winCloseConfirm.all = -100;
                winCloseConfirm.hide();
            });
        }

        tabEditors.addEventListener("close", this.$close = function(e){
            if (e.page.$at.undolength) {
                winCloseConfirm.page = e.page;
                winCloseConfirm.all = 0;
                winCloseConfirm.show();
                
                winCloseConfirm.addEventListener("hide", function(){
                    if (winCloseConfirm.all != -100) {
                        tabEditors.remove(winCloseConfirm.page, true);
                        winCloseConfirm.page.$at.undo(-1);
                        delete winCloseConfirm.page;
                    }
                    winCloseConfirm.removeEventListener("hide", arguments.callee);
                });
                
                btnYesAll.hide();
                btnNoAll.hide();
                
                e.preventDefault();
            }
        });

        var nodes = barSave.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            this.nodes.push(ide.barTools.appendChild(nodes[0]));
        }

        btnSave.onclick = _self.quicksave;

        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.divider(), ide.mnuFile.firstChild),
        
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Save All",
                onclick : function(){
                    _self.saveall();
                },
                disabled : "{!tabEditors.activepage}"
            }), ide.mnuFile.firstChild),
                
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Save As",
                onclick : function () {
                    txtSaveAs.setValue(tabEditors.getPage().$model.data.getAttribute("path"));
                    winSaveAs.show();
                },
                disabled : "{!tabEditors.activepage}"
            }), ide.mnuFile.firstChild),
            
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Save",
                onclick : _self.quicksave,
                disabled : "{!tabEditors.activepage}"
            }), ide.mnuFile.firstChild)
        );

        this.hotitems["quicksave"] = [this.nodes[this.nodes.length - 1]];
    },
    
    saveall : function(){
        var pages = tabEditors.getPages();
        for (var i = 0; i < pages.length; i++) {
            if (pages[i].$at.undolength)
                this.quicksave(pages[i]);
        }
    },
    
    saveAllInteractive : function(pages, callback){
        winCloseConfirm.all = 0;
                
        var _self = this;
        apf.asyncForEach(pages, function(item, next){
            if (item.$at.undolength) {
                if (winCloseConfirm.all == 1)
                    _self.quicksave(item);
                //else if (winCloseConfirm.all == -1)
                    //item.$at.undo(-1);

                if (winCloseConfirm.all)
                    return next();
                
                tabEditors.set(item);
                winCloseConfirm.page = item;
                winCloseConfirm.show();
                winCloseConfirm.addEventListener("hide", function(){
                    if (winCloseConfirm.all == 1)
                        _self.quicksave(item);
                    //else if (winCloseConfirm.all == -1)
                        //item.$at.undo(-1);

                    winCloseConfirm.removeEventListener("hide", arguments.callee);
                    next();
                });
                
                btnYesAll.setProperty("visible", pages.length > 1);
                btnNoAll.setProperty("visible", pages.length > 1);
            }
            else
                next();
        },
        function(){
            callback(winCloseConfirm.all);
        });
    },

    quicksave : function(page) {
        if (!page || !page.$at)
            page = tabEditors.getPage();

        if (!page)
            return;

        var doc  = page.$doc;
        var node = doc.getNode();
        if (node.getAttribute("debug"))
            return;

        var path = node.getAttribute("path");
        var data = doc.getValue();
        
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
            }, 2500);
        });
        
        page.$at.reset(); //@todo this sucks... please fix
        return false;
    },
    
    saveas : function () {
        var page    = tabEditors.getPage(),
            file    = page.$model.data,
            path    = file.getAttribute("path"),
            newPath = txtSaveAs.getValue();
            
        function onconfirm() {
            var panel   = sbMain.firstChild,
                value   = page.$doc.getValue();
  
            console.log(value);
            winConfirm.hide();
            winSaveAs.hide();
            
            panel.setAttribute("caption", "Saving file " + newPath);
            fs.saveFile(newPath, value, function(value, state, extra) {
                if (state != apf.SUCCESS)
                   util.alert("Could not save document",
                              "An error occurred while saving this document",
                              "Please see if your internet connection is available and try again.");            
                panel.setAttribute("caption", "Saved file " + newPath);
                if (path != newPath)
                    fs.beforeRename(file, null, newPath);
	            setTimeout(function () {
	               if (panel.caption == "Saved file " + newPath)
	                   panel.removeAttribute("caption");
	            }, 2500);
            });
        };
    
        if (path != newPath) {
            var name    = newPath.match(/\/([^/]*)$/)[1],
                folder  = newPath.match(/\/([^/]*)\/[^/]*$/)[1];
                                
	        util.confirm(
	            "Are you sure?",
	            "\"" + name + "\" already exists, do you want to replace it?",
	            "A file or folder with the same name already exists in the folder "
	            + folder + ". "
	            + "Replacing it will overwrite it's current contents.",
	            onconfirm);
        } else
            onconfirm();
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
