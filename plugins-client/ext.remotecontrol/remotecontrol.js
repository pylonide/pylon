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
        
        ide.addEventListener("init.ext/filesystem/filesystem", function(e) {
            if (_self.socketMessage)
                _self.loadFileOrFolder();
        });
        
        ide.addEventListener("socketMessage", function (event) {
            if (event.message.type === "remotecontrol") {
                _self.socketMessage = event; 
                
                if (filesystem.inited)
                    _self.loadFileOrFolder();       
            }
        });
    },

    loadFileOrFolder : function() {
        var _self = this;
        
        if (_self.socketMessage.message.action === "openfile") {
            // Generic case: hide sidebar (do this first, 'cause it's a little slow)
            if (_self.socketMessage.currentTarget && _self.socketMessage.currentTarget.workspaceId == "generic") {
                require("ext/panels/panels").deactivate(null, false);
            }
            
            // Brand new file: create a dummy file that, when saved, becomes real (can be generic or workspace)
            if (_self.socketMessage.message.args.noexist === true) {
                var node = apf.getXml("<file />");

                node.setAttribute("path", _self.socketMessage.message.args.path);
                node.setAttribute("name", _self.socketMessage.message.args.path.split("/").pop());
                node.setAttribute("newfile", "1");

                var doc = ide.createDocument(node);
                doc.cachedValue = "";
                            
                ide.dispatchEvent("openfile", {doc: doc, node: node});
            }
            else {// Generic case: open the file
                editors.showFile(_self.socketMessage.message.args.path);
                
                // Workspace case: the file is found in tree, expand it
                if (_self.socketMessage.currentTarget.workspaceId !== "generic") {
                    var node = apf.getXml("<file />");
                    node.setAttribute("path", _self.socketMessage.message.args.path);
                    
                    tabbehaviors.revealInTree(node);
                }
            }
        }
        else if (_self.socketMessage.message.action === "opendir") {
            var node = filesystem.model.queryNode("//folder[@path='" + _self.socketMessage.message.args.path + "']");
            if (!node) {
                node = editors.createFolderNodeFromPath(_self.socketMessage.message.args.path);
            }
            
            tabbehaviors.revealInTree(node);
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
