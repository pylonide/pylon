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

// Attaching to exports.module for testing purposes
var strip = module.exports.strip = function () {
    if (!editors.currentEditor.ceEditor)
        return;

    var editor = editors.currentEditor.ceEditor.$editor;
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

    commands: {
        "stripws": {
            hint: "strip whitespace at the end of each line"
        }
    },

    nodes: [],

    init: function () {},

    hook: function () {
        var self = this;

        this.nodes.push(
            menus.addItemByPath("Tools/Strip Whitespace", new apf.item({
                onclick: function () {
                    ext.initExtension(self);
                    strip();
                }
            }), 200);
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

        require("ext/settings/settings").addSettings("General", markupSettings);
    },

    stripws: function() {
        strip();
    },

    enable: function () {
        this.nodes.each(function(item) {
            item.enable();
        });

        this.stripws = function() { strip(); };
    },

    disable: function () {
        this.nodes.each(function(item) {
            item.disable();
        });

        this.stripws = function() {};
    },

    destroy: function () {
        menus.remove("Tools/Strip Whitespace");
        
        this.nodes.each(function (item) {
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});
});
