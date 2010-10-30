/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/tree/tree",
    ["core/ide", "core/ext",
     "ext/filesystem/filesystem", "ext/settings/settings", 
     "ext/panels/panels", "text!ext/tree/tree.xml"],
    function(ide, ext, fs, settings, panels, markup) {

return ext.register("ext/tree/tree", {
    name    : "Tree",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    visible : true,
    
    //@todo deprecated?
    getSelectedPath: function() {
        return trFiles.selected.getAttribute("path");
    },
    
    hook : function(){
        panels.register(this);
    },

    init : function() {
        this.panel = winFilesViewer;
        colLeft.appendChild(winFilesViewer);
        trFiles.setAttribute("model", fs.model);
        
        trFiles.addEventListener("afterchoose", this.$afterselect = function(e) {
            var node = this.selected;
            if (!node || node.tagName != "file" || this.selection.length > 1)
                return;

            ide.dispatchEvent("openfile", {doc: ide.createDocument(node)});
        });
        
        trFiles.addEventListener("beforerename", function(e){
            setTimeout(function(){
                fs.beforeRename(e.args[0], e.args[1]);
            });
        });
        
        trFiles.addEventListener("beforemove", function(e){
            setTimeout(function(){
                var changes = e.args;
                for (var i = 0; i < changes.length; i++) {
                    fs.beforeMove(changes[i].args[0], changes[i].args[1]);
                }
            });
        });

        /**** Support for state preservation ****/
        
        var expandedList = {}, loading = false, changed = false;
        trFiles.addEventListener("expand", function(e){
            expandedList[e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)] = e.xmlNode;

            if (!loading) {
                changed = true;
                settings.save();
            }
        });
        trFiles.addEventListener("collapse", function(e){
            delete expandedList[e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)];
            
            if (!loading) {
                changed = true;
                settings.save();
            }
        });

        var currentSettings = [];
        ide.addEventListener("loadsettings", function(e){
            var strSettings = e.model.queryValue("auto/tree");
            if (strSettings) {
                loading = true;
                currentSettings = apf.unserialize(strSettings);
                
                //Unstable - temporary fix
                try{
                    trFiles.expandList(currentSettings, function(){
                        loading = false;
                    });
                }catch(e){
                    e.model.setQueryValue("auto/tree/text()", "");
                }
            }
        });

        ide.addEventListener("savesettings", function(e){
            if (!changed)
                return;
            
            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/tree/text()");

            currentSettings = [];

            var path, id, lut = {};
            for (id in expandedList) {
                try {
                    path = apf.xmlToXpath(expandedList[id], trFiles.xmlRoot);
                    lut[path] = true;
                }
                catch(e){
                    //Node is deleted
                    delete expandedList[id];
                }
            }
            
            var cc, parts;
            for (path in lut) {
                parts = path.split("/");
                cc = parts.shift();
                do {
                    if (!parts.length) 
                        break;
                    
                    cc += "/" + parts.shift();
                } while(lut[cc]);
                
                if (!parts.length)
                    currentSettings.push(path);
            }
            
            xmlSettings.nodeValue = apf.serialize(currentSettings);
            return true;
        });
    },

    enable : function(){
        winFilesViewer.show();
    },

    disable : function(){
        winFilesViewer.hide();
    },

    destroy : function(){
        davProject.destroy(true, true);
        mdlFiles.destroy(true, true);
        trFiles.destroy(true, true);

        trFiles.removeEventListener("afterselect", this.$afterselect);
        
        panels.unregister(this);
    }
});

});