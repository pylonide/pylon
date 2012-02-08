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
var extSettings = require("ext/settings/settings");

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
            ide.mnuEdit.appendChild(new apf.divider()), ide.mnuEdit.appendChild(new apf.item({
                caption: "Strip Whitespace",
                onclick: function () {
                    ext.initExtension(self);
                    strip();
                }
            }))
        );

        ide.addEventListener("beforefilesave", function(data) {
            var node =
                extSettings.model.data.selectSingleNode("editors/code/@stripws");

            // If the 'Strip whitespace on save' option is enabled, we strip
            // whitespaces from the node value just before the file is saved.
            if (node && node.firstChild && node.firstChild.nodeValue == "true") {
                strip();
            }
        });

        ide.addEventListener("init.ext/settings/settings", function (e) {
            var heading = e.ext.getHeading("General");
            heading.appendChild(new apf.checkbox({
                "class" : "underlined",
                skin  : "checkbox_grey",
                value : "[editors/code/@stripws]",
                label : "On Save, Strip Whitespace"
            }))
        });
    },

    stripws: function() {
        strip();
    },

    enable: function () {
        this.nodes.each(function (item) {
            item.enable();
        });
    },

    disable: function () {
        this.nodes.each(function (item) {
            item.disable();
        });
    },

    destroy: function () {
        this.nodes.each(function (item) {
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});
});