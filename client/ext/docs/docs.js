/**
 * Documentation for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/docs/docs",
    ["core/ide", "core/ext", "ext/panels/panels", "text!ext/docs/docs.xml"], 
    function(ide, ext, panels, markup) {

return ext.register("ext/docs/docs", {
    name    : "Documentation",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    
    hook : function(){
        panels.register(this);
    },

    init : function(amlNode){
        //Append the docs window at the right of the editor
        ide.vbMain.selectSingleNode("a:hbox/a:vbox[3]").appendChild(winDocViewer);
        
        this.panel = winDocViewer;
    },

    enable : function(){
        winDocViewer.show();
    },

    disable : function(fromParent){
        winDocViewer.hide();
    },

    destroy : function(){
        winDocViewer.destroy(true, true);
        panels.unregister(this);
    }
});

});