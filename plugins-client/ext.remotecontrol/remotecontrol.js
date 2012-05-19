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
        ide.addEventListener("socketMessage", function (event) {
                    
            if (event.message.type === "remotecontrol") {

                if (event.message.action === "openfile") {
                    // Workspace case: if the file is found in tree, expand it
                    var node = filesystem.model.queryNode("//file[@path='" + event.message.args.path + "']");
                    if (node) {
                        tabbehaviors.revealInTree(node);
                        ide.dispatchEvent("openfile", {doc: ide.createDocument(node), node: node});
                    } // Brand new file: create a dummy file that, when the user saves it, becomes real
                    else if (node === null && event.message.args.noexist === true) {
                        var node = apf.getXml("<file />");

                        node.setAttribute("path", event.message.args.path);
                        node.setAttribute("name", event.message.args.path.split("/").pop());
                        node.setAttribute("newfile", "1");

                        var doc = ide.createDocument(node);
                        doc.cachedValue = "";
                                    
                        ide.dispatchEvent("openfile", {doc: doc, node: node});
                    } // Generic case: open the file, hide the sidebar
                    else {
                        editors.showFile(event.message.args.path);

                        if (event.currentTarget && event.currentTarget.workspaceId == "generic") {
                            require("ext/panels/panels").deactivate(null, false);
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
        });
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});
