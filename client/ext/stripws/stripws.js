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
var Range = require("ace/range").Range;
var settings = require("text!ext/stripws/settings.xml");
var extSettings = require("ext/settings/settings");

var RE_WS = /[ \t\r\f\v]+\n/g;

// Attaching to exports.module for testing purposes
var strip = module.exports.strip = function () {
    if (!editors.currentEditor.ceEditor)
        return;

    var editor = editors.currentEditor.ceEditor.$editor;
    var session = editor.getSession()
    var source = session.getValue();
    var selection = session.getSelection();
    var result = source.replace(RE_WS, "\n");
    var pos, lead, anchor;

    // Check whether the user has text selected
    if (!selection.isEmpty()) {
        lead = selection.getCursor();
        anchor = selection.getSelectionAnchor();
    } else {
        pos = editor.getCursorPosition();
    }

    // Set the new trimmed buffer contents
    session.setValue(result);

    if (lead && anchor) {
        var selection = session.getSelection();

        selection.setSelectionAnchor(anchor.row, anchor.column);
        selection.moveCursorTo(lead.row, lead.column);
    } else if (pos) {
        editor.moveCursorTo(pos.row, pos.column);
    }

    return result;
}

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
            barSettings.insertMarkup(settings);
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
