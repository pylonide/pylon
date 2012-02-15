/**
 * Documentation for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var panels = require("ext/panels/panels")
var markup = require("text!ext/docs/docs.xml");

module.exports = ext.register("ext/docs/docs", {
    name    : "Documentation Viewer",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    nodes : [],

    /*hook : function(){
        panels.register(this);
    },*/
    
    init : function(amlNode){
        var _self = this;
        
        //Append the docs window to the right of the editor
        ide.vbMain.selectSingleNode("a:vbox[1]/a:hbox[1]").appendChild(winDocViewer);
        
        //this.panel = winDocViewer;
        
        this.nodes.push(
            winDocViewer,
            mnuWindows.appendChild(new apf.item({
                id: "chkDocViewerOpen",
                caption: "Documentation Viewer",
                type: "check",
                "onprop.checked" : function(e) {
                    if (e.value)
                        _self.enable();
                    else
                        _self.disable();
                }
            }))
        );
        
        tbDocsSearch.addEventListener("keydown", function(e){
            if (tbDocsSearch.value == "") {
                return;
            }

            if (e.keyCode == 13){
                tbDocsSearch.load(this.example);
            }
        });
        
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