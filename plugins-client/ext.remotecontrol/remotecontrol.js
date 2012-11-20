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
var fs = require("ext/filesystem/filesystem");
var tabbehaviors = require("ext/tabbehaviors/tabbehaviors");
var editors = require("ext/editors/editors");
var markup = require("text!ext/remotecontrol/remotecontrol.xml");

module.exports = ext.register("ext/remotecontrol/remotecontrol", {
    name   : "Remote Control",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,

    init : function(amlNode) {
        var _self = this;

        ide.addEventListener("panels.activateDefault", function (e) {
            if (e.currentTarget.workspaceId === "generic")
                return false;
            return true;
        });

        ide.addEventListener("socketMessage", function (event) {
            _self.handleMessage(event);
        });

        ide.addEventListener("localUpdateAvailable", function(e) {
            apf.setStyleClass(logobar.$ext, "updateAvailable");
            backToC9.setAttribute("onclick", "winUpdate.show();");
            backToC9.setAttribute("title", "Update available");
            backToC9.removeAttribute("href");
        });
    },

    handleMessage : function(event) {
        if (event.message.type === "remotecontrol") {
            if (event.message.action === "openfile") {
                // Generic case: hide sidebar (do this first, it's a little slow)
                if (event.message.args.options.name === "generic") {
                    require("ext/panels/panels").deactivate(null, false);
                }

                // Brand new file: create a dummy file that, when saved, becomes real (can be generic or workspace)
                if (event.message.args.options.noexist === true) {
                    var node = fs.createFileNodeFromPath(event.message.args.path);
                    node.setAttribute("newfile", "1");
                    node.setAttribute("cli", "1"); // blocks Save As dialog

                    var doc = ide.createDocument(node);
                    doc.cachedValue = "";

                    ide.dispatchEvent("openfile", {doc: doc, node: node});
                }
                else {// Generic and Workspace case: open a single file
                    editors.gotoDocument({path: event.message.args.path});

                    // Workspace case: the file is found in tree, expand it
                    if (event.message.args.options.name !== "generic") {
                        var node = fs.createFileNodeFromPath(event.message.args.path);

                        tabbehaviors.revealInTree(node);
                    }
                }
            }
            else if (event.message.action === "opendir") {
                var node = fs.model.queryNode("//folder[@path=" + util.escapeXpathString(event.message.args.path) + "]");
                if (!node) {
                    node = fs.createFolderNodeFromPath(event.message.args.path);
                }

                tabbehaviors.revealInTree(node);
            }
            else if (event.message.action === "notify") {
                var eventName = event.message.args.event.name;
                if (eventName === "internet-available") {
                    var state = event.message.args.event.value;

                    if (state === false)
                        ide.dispatchEvent("localOffline", event);
                    else
                        ide.dispatchEvent("localOnline", event);
                }
                else if (eventName === "c9local-update") {
                    ide.dispatchEvent("localUpdateAvailable", event);
                }
                else if (eventName === "workspace-deleted") {
                    winWSDeleted.show();
                }
            }
        }
    },

    rebootWithUpdate : function() {
        winUpdate.hide();
        apf.ajax("/c9local/reboot-with-update", {
            method: "POST",
            headers: {"Content-type": "application/x-www-form-urlencoded"},
            async: true,
            callback: function( data, state, extra) {
                if (state != apf.SUCCESS) {
                    return util.alert("Update Error",
                        "Unable to reboot runtime with update.",
                        extra.http.responseText);
                }
                else {
                    location.reload();
                }
            }
        });

    }
});

});
