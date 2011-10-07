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
var util = require("./util");
var canon = require("pilot/canon");
var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var settings = require("text!ext/stripws/settings.xml");
var extSettings = require("ext/settings/settings");

var strip = function (editor) {
    var editor = editors.currentEditor.ceEditor.$editor;
    var session = editor.getSession()
    var source = session.getValue();
    var pos = editor.getCursorPosition();

    var result = source.replace(/[ \t\r\f\v]+\n/g, "\n");
    session.setValue(result);
    var lineLength = session.getLine(pos.row).length;
    editor.moveCursorTo(pos.row, pos.column >= lineLength ? lineLength : pos.column);

    return result;
}

module.exports = ext.register("ext/stripws/stripws", {
    name: "Strip Whitespace",
    dev: "Ajax.org",
    alone: true,
    type: ext.GENERAL,

    commands: {
        "stripws": {
            hint: "strip whitespace at the end of the lines"
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
            console.log("SETTINGS", extSettings.model)
            if (extSettings.model.data.
                selectSingleNode("editors/code/@stripws").
                firstChild.nodeValue == "true")
            {
                data.doc.setValue(strip());
            }
        });

        canon.addCommand({
            name: "stripws",
            exec: function() { strip(); }
        });

        ide.addEventListener("init.ext/settings/settings", function (e) {
            barSettings.insertMarkup(settings);
        });
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
