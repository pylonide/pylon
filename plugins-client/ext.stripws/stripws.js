/**
 * Strip whitespace extension for the Cloud9 IDE client
 *
 * Strips whitespace at the end of each line in the current buffer.
 *
 * @author Sergi Mansilla
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function (require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var menus = require("ext/menus/menus");
var extSettings = require("ext/settings/settings");
var markupSettings =  require("text!ext/stripws/settings.xml");
var commands = require("ext/commands/commands");
var settings = require("ext/settings/settings");

// Attaching to exports.module for testing purposes
var strip = module.exports.strip = function () {
    if (!editors.currentEditor.amlEditor)
        return;

    var editor = editors.currentEditor.amlEditor.$editor;
    var session = editor.getSession();

    var doc = session.getDocument();
    var lines = doc.getAllLines();

    for (var i = 0, l=lines.length; i < l; i++) {
        var line = lines[i];
        var index = line.search(/\s+$/);

        if (index !== -1)
            doc.removeInLine(i, index, line.length);
    }
    session.$syncInformUndoManager();
};

module.exports = ext.register("ext/stripws/stripws", {
    name: "Strip Whitespace",
    dev: "Ajax.org",
    alone: true,
    type: ext.GENERAL,

    nodes: [],

    init: function () {},

    hook: function () {
        var self = this;

        commands.addCommand({
            name: "stripws",
            hint: "strip whitespace at the end of each line",
            isAvailable : function(editor){
                return editor && editor.path == "ext/code/code";
            },
            exec: function(){
                ext.initExtension(self);
                self.stripws();
            }
        });

        this.nodes.push(
            menus.addItemByPath("Tools/Strip Whitespace", new apf.item({
                command : "stripws"
            }), 200)
        );

        ide.addEventListener("beforefilesave", function(data) {
            var node =
                extSettings.model.data.selectSingleNode("editors/code/@stripws");

            // If the 'Strip whitespace on save' option is enabled, we strip
            // whitespaces from the node value just before the file is saved.
            if (node && node.firstChild && node.firstChild.nodeValue == "true") {
                self.stripws();
            }
        });

        ide.addEventListener("settings.load", function(){
            settings.setDefaults("editors/code", [["stripws", "false"]]);
        });

        settings.addSettings("General", markupSettings);
    },

    stripws: function() {
        strip();
    },

    enable: function () {
        ext.initExtension(this);
        this.$enable();
        this.stripws = function() { strip(); };
    },

    disable: function () {
        this.$disable();
        this.stripws = function() {};
    },

    destroy: function () {
        menus.remove("Tools/Strip Whitespace");
        commands.removeCommandByName("stripws");
        this.$destroy();
    }
});
});
