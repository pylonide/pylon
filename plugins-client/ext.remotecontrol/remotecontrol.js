/**
 * Remote Control Module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var filesystem = require("ext/filesystem/filesystem");
var tabbehaviors = require("ext/tabbehaviors/tabbehaviors");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/remotecontrol/remotecontrol", {
    name   : "Remote Control",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    deps   : [],

    init : function(amlNode) {
        var _self = this;
        
        ide.addEventListener("panels.activateDefault", function (e) {
            if (e.currentTarget.workspaceId === "generic")
                return false;
            return true;
        });
        
        ide.addEventListener("socketMessage", function (event) {
            _self.loadFileOrFolder(event); 
        });
    },

    loadFileOrFolder : function(event) {
        if (event.message.type === "remotecontrol") {
            if (event.message.action === "openfile") {
                // Generic case: hide sidebar (do this first, it's a little slow)
                if (event.message.args.options.name === "generic") {
                    require("ext/panels/panels").deactivate(null, false);
                }
                
                // Brand new file: create a dummy file that, when saved, becomes real (can be generic or workspace)
                if (event.message.args.options.noexist === true) {
                    var node = editors.createFileNodeFromPath( event.message.args.path);
                    node.setAttribute("newfile", "1");
                    node.setAttribute("cli", "1"); // blocks Save As dialog
    				
                    var doc = ide.createDocument(node);
                    doc.cachedValue = "";
                                
                    ide.dispatchEvent("openfile", {doc: doc, node: node});
                }
                else {// Generic case: open the file
                    editors.showFile(event.message.args.path);
                    
                    // Workspace case: the file is found in tree, expand it
                    if (event.message.args.options.name !== "generic") {
                        var node = editors.createFileNodeFromPath(event.message.args.path);
                        
                        tabbehaviors.revealInTree(node);
                    }
                }
            }
            else if (event.message.action === "opendir") {
                var node = filesystem.model.queryNode("//folder[@path='" + event.message.args.path + "']");
                if (!node) {
                    node = editors.createFolderNodeFromPath(event.message.args.path);
                }
                
                tabbehaviors.revealInTree(node);
            }
        }
    },
    
    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});
