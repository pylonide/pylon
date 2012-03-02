/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var markup = require("text!ext/gotofile/gotofile.xml");

module.exports = ext.register("ext/gotofile/gotofile", {
    name    : "Filter Tree",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    markup  : markup,
    offline : false,
    commands : {
        "gotofile": {hint: "search for a filename and jump to it"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            mnuFile.insertBefore(new apf.item({
                caption : "Open...",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }), mnuFile.firstChild),

            ide.barTools.appendChild(new apf.button({
                id      : "btnOpen",
                icon    : "open.png",
                width   : 29,
                tooltip : "Open...",
                skin    : "c9-toolbarbutton",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }))
        );

        this.hotitems["gotofile"] = [this.nodes[0]];
    },

    init : function() {
        var _self = this;
        
        txtGoToFile.addEventListener("keydown", function(e){
            if (txtGoToFile.value == "") {
                return;
            }

            if (e.keyCode == 13){
                //var node = trFiles.xmlRoot.selectSingleNode("folder[1]");
                mdlGoToFile.load("{davProject.report('" + ide.davPrefix //node.getAttribute("path")
                    + "', 'filesearch', {query: '" + txtGoToFile.value + "'})}");
                ide.dispatchEvent("track_action", {type: "gotofile"});
            }
            else if (e.keyCode == 40 && dgGoToFile.length) {
                var first = dgGoToFile.getFirstTraverseNode();
                if (first) {
                    dgGoToFile.select(first);
                    dgGoToFile.focus();
                }
            }
        });
        
        dgGoToFile.addEventListener("keydown", function(e) {
            if (e.keyCode == 38 && !e.shiftKey) {
                if (this.selected == this.getFirstTraverseNode())
                    txtGoToFile.focus();
            }
            else if (apf.isCharacter(e.keyCode)) {
                txtGoToFile.focus();
            }
        }, true);

        dgGoToFile.addEventListener("afterchoose", function(e) {
            _self.openFile();
        });

        this.nodes.push(winGoToFile);
    },
    
    openFile: function(){
        var nodes = dgGoToFile.getSelection();
        
        if(nodes.length == 0)
            return false;
            
        winGoToFile.hide();
        for (var i = 0; i < nodes.length; i++) {
            var path = ide.davPrefix.replace(/[\/]+$/, "") + "/" 
                + apf.getTextNode(nodes[i]).nodeValue.replace(/^[\/]+/, "");
            editors.showFile(path, 0, 0);
            ide.dispatchEvent("track_action", {type: "fileopen"});
        }
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