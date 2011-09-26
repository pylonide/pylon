/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

/**
 * This function must be called only when the selected node is a folder.
 * Check if the currently selected node in the tree it's going to be pasted
 * within itself.
 * 
 * @return Boolean
 */
function hasNodeInStore(amlTree) {
    var selectedNodes = apf.clipboard.get() || [];
    var selectedNode = {
        name: amlTree.selected.getAttribute("name") || "",
        mdat: amlTree.selected.getAttribute("modifieddate") || ""
    };
    
    return selectedNodes.some(function(n) {
        var name = n.getAttribute("name");
        var mdat = n.getAttribute("modifieddate");
        return (name === selectedNode.name && mdat === selectedNode.mdat);
    });
}
 
module.exports = ext.register("ext/clipboard/clipboard", {
    dev    : "Ajax.org",
    name   : "Clipboard",
    alone  : true,
    type   : ext.GENERAL,
    /*commands: {
        "cut": {hint: "cut the selected text to the clipboard"},
        "copy": {hint: "copy the selected text to the clipboard"},
        "paste": {hint: "paste text from the clipboard into the active document"}
    },*/

    nodes : [],

    init : function(amlNode){
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Cut",
                onclick : this.cut
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Copy",
                onclick : this.copy.bind(this, true),
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Paste",
                onclick : this.paste.bind(this, true),
                disabled: "{apf.clipboard.empty}"
            }))
        );

        /*this.hotitems = {
            "cut" : [this.nodes[1]],
            "copy" : [this.nodes[2]],
            "paste" : [this.nodes[3]]
        };*/
    },

    cut: function() {
        if (apf.document.activeElement == trFiles)
            apf.clipboard.cutSelection(trFiles);
    },

    copy: function(apply) {
        if (apf.document.activeElement == trFiles || apply)
            apf.clipboard.copySelection(trFiles);
    },

    paste: function(apply) {
        if (apf.document.activeElement == trFiles || apply) {
            var selected = null;
            
            if (trFiles.selected.getAttribute("type") !== "folder")
                selected = trFiles.selected.parentNode;
            else if (hasNodeInStore(trFiles))
                return;
            
            apf.clipboard.pasteSelection(trFiles, selected);
            apf.clipboard.clear();
            apf.clipboard.store = null;
        }
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