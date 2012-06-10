/**
 * Remote Control Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
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
                    // If node is found in tree we expand it
                    var node = filesystem.model.queryNode("//file[@path='" + event.message.args.path + "']");
                    if (node) {
                        tabbehaviors.revealInTree(node);
                    }

                    editors.gotoDocument({path: event.message.args.path});
                }
                else if (event.message.action === "opendir") {
                    
                    var node = filesystem.model.queryNode("//file[@path='" + event.message.args.path + "']");
                    if (!node) {
                        node = editors.createFileNodeFromPath(event.message.args.path);
                    }
                    
                    // TODO: Directory is not selected in tree.
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
