/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/gotofile/gotofile",
    ["core/ide", 
     "core/ext",
     "ext/filesystem/filesystem", 
     "ext/settings/settings",
     "ext/tree/tree",
     "text!ext/gotofile/gotofile.xml"],
    function(ide, ext, fs, settings, tree, markup) {
        
return ext.register("ext/gotofile/gotofile", {
    name    : "Filter Tree",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    hotkeys : {"gotofile":1},
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            mnuEdit.appendChild(new apf.item({
                caption : "Go To File",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }))
        );
        
        this.hotitems["gotofile"] = [this.nodes[0]];
    },

    init : function() {
        txtGoToFile.addEventListener("keydown", function(e){
            if (e.keyCode == 13){
                var node = trFiles.xmlRoot.selectSingleNode("folder[1]");
                mdlGoToFile.load("{davProject.report('" + node.getAttribute("path")
                    + "', 'filesearch', {query: '" + txtGoToFile.value + "'})}");
            }
            else if (e.keyCode == 40 && dgGoToFile.length) {
                var first = dgGoToFile.getFirstTraverseNode();
                if (first) {
                    dgGoToFile.select(first);
                    dgGoToFile.focus();
                }
            }
        });
        
        var _self = this, restricted = [38, 40, 36, 35];
        dgGoToFile.addEventListener("keydown", function(e) {
            if (e.keyCode == 38) {
                if (this.selected == this.getFirstTraverseNode())
                    txtGoToFile.focus();
            }
            else if (e.keyCode == 27) {
                _self.toggleDialog(-1);
            }
            else if (restricted.indexOf(e.keyCode) == -1) {
                txtGoToFile.focus();
            }
        }, true);

        dgGoToFile.addEventListener("afterchoose", function(e) {
            winGoToFile.hide();
            var root = trFiles.selected;
            while (root.tagName != "folder")
                root = root.parentNode;
            var path   = root.getAttribute("path") + apf.getTextNode(e.xmlNode).nodeValue,
                chunks = path.split("/"),
                node   = apf.n("<file />")
                    .attr("name", chunks[chunks.length-1])
                    .attr("contenttype", "application/javascript")
                    .attr("path", path)
                    .node();
            ide.dispatchEvent("openfile", {node: node});
        });
    },
    
    gotofile : function(){
        this.toggleDialog(true);
        return false;
    },
    
    toggleDialog: function(forceShow) {
        ext.initExtension(this);
        
        if (!winGoToFile.visible || forceShow)
            winGoToFile.show();
        else
            winGoToFile.hide();
        return false;
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
        winGoToFile.destroy(true, true);
        this.nodes = [];
    }
});

});