/**
 * Code Editor for the Ajax.org Cloud IDE
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
    
    getSelectedPath: function() {
        return this.trFiles.selected.getAttribute("path");
    },
    
    hook : function(){
        panels.register(this);
    },

    init : function() {
        this.trFiles = this.panel = winFilesViewer;
        ide.vbMain.selectSingleNode("a:hbox[1]/a:vbox[1]").appendChild(winFilesViewer);
        trFiles.setAttribute("model", fs.model);
        
        trFiles.addEventListener("afterselect", this.$afterselect = function(e) {
            var node = this.selected;
            if (!node || node.tagName != "file" || this.selection.length > 1)
                return;

            ide.dispatchEvent("openfile", {node: node});
        });

        /**** Support for state preservation ****/
        
        var expandedList = {};
        trFiles.addEventListener("expand", function(e){
            expandedList[e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)] = e.xmlNode;
        });
        trFiles.addEventListener("collapse", function(e){
            delete expandedList[e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)];
        });

        var currentSettings = [];
        ide.addEventListener("loadsettings", function(e){
            var strSettings = e.model.queryValue("auto/tree");
            if (strSettings) {
                currentSettings = apf.unserialize(strSettings);
                trFiles.expandList(currentSettings);
            }
        });

        ide.addEventListener("savesettings", function(e){
            var changed = false, 
                xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/tree/text()");

            var path, id;
            for (id in expandedList) {
                path = apf.xmlToXpath(expandedList[id], trFiles.xmlRoot);
                if (currentSettings.indexOf(path) == -1) {
                    currentSettings.push(path);
                    changed = true;
                }
            }
            
            if (changed) {
                xmlSettings.nodeValue = apf.serialize(currentSettings);
                return true;
            }
        });
    },

    enable : function(){
        trFiles.show();
    },

    disable : function(){
        trFiles.hide();
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