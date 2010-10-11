/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/filtertree/filtertree",
    ["core/ide", 
     "core/ext",
     "ext/tree/tree", 
     "ext/filesystem/filesystem", 
     "ext/settings/settings", 
     "text!ext/filtertree/filtertree.xml"],
    function(ide, ext, tree, fs, settings, markup) {
        
return ext.register("ext/filtertree/filtertree", {
    name    : "Filter Tree",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    visible : true,

    nodes : [],

    init : function() {
        var page = tabFilesViewer.add("Search", "search");
        var junction = page.appendChild(
            page.ownerDocument.createElementNS(apf.ns.aml, "junction"));
        junction.setAttribute("for", "hbFileFilter");
        page.appendChild(dgFileFilter);
        dgFileFilter.show();
        
        trFiles.setAttribute("anchors", "34 0 0 0");
        trFiles.setAttribute("border", "1 0 0 0");
        
        var pnode = trFiles.parentNode;
        junction2 = pnode.appendChild(
            pnode.ownerDocument.createElementNS(apf.ns.aml, "junction"));
        junction2.setAttribute("for", "hbFileFilter");
        
        hbFileFilter.show();
        
        txtFileFilter.addEventListener("keydown", function(e){
            if (e.keyCode == 13){
                tabFilesViewer.set("search");
                mdlFileFilter.load("ext/filtertree/search.xml", {
                    keyword: txtFileFilter.value
                });
            }
        });
        
        this.nodes.push(junction, junction2, mdlFileFilter, hbFileFilter, dgFileFilter);
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