/**
 * Beautify extension for the Cloud9 IDE client
 *
 * Reformats the selected code in the current document
 *
 * Processing/formatting code from https://github.com/einars/js-beautify
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function (require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var util = require("core/util");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var jsbeautify = require("ext/beautify/res/jsbeautify/jsbeautify-min");
var markupSettings = require("text!ext/beautify/settings.xml");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/beautify/beautify", {
    name: "JS Beautify",
    dev: "Ajax.org",
    alone: true,
    type: ext.GENERAL,

    nodes: [],

    beautify: function (editor) {
        if (this.disabled === true)
            return;

        if (!editor)
            editor = editors.currentEditor;

        var sel = editor.getSelection();
        var doc = editor.getDocument();
        var range = sel.getRange();
        var value = doc.getTextRange(range);

        // Load up current settings data
        var preserveEmpty = apf.isTrue(settings.model.queryValue("beautify/jsbeautify/@preserveempty"));
        var keepIndentation = apf.isTrue(settings.model.queryValue("beautify/jsbeautify/@keeparrayindentation"));
        var jsLintHappy = apf.isTrue(settings.model.queryValue("beautify/jsbeautify/@jslinthappy"));
        var braces = settings.model.queryValue("beautify/jsbeautify/@braces") || "end-expand";
        var indentSize = settings.model.queryValue("editors/code/@tabsize");
        var indentTab = apf.isTrue(settings.model.queryValue("editors/code/@softtabs")) ? " " : "\t";

        if (indentTab == "\t") indentSize = 1;

        var line = doc.getLine(range.start.row);
        var indent = line.match(/^\s*/)[0];
        var trim = false;

        if (range.start.column < indent.length)
            range.start.column = 0;
        else
            trim = true;

        try {
            value = jsbeautify.js_beautify(value, {
                indent_size: indentSize,
                indent_char: indentTab,
                preserve_newlines: preserveEmpty,
                keep_array_indentation: keepIndentation,
                brace_style: braces,
                jslint_happy: jsLintHappy
            });
            value = value.replace(/^/gm, indent);
            if (trim) value = value.trim();
        }
        catch (e) {
            util.alert("Error", "This code could not be beautified", "Please correct any JavaScript errors and try again");
            return;
        }

        var end = doc.replace(range, value);
        sel.setSelectionRange(Range.fromPoints(range.start, end));
    },

    init: function () {
        ide.addEventListener("revisions.visibility", function(e) {
            if (e.visibility === "shown")
                _self.disable();
            else
                _self.enable();
        });
    },

    hook: function () {
        var _self = this;

        this.nodes.push(
            menus.addItemByPath("Tools/Beautify Selection", 
              this.mnuItem = new apf.item({
                  disabled : "true",
                  command  : "beautify"
              }), 100)
        );

        commands.addCommand({
            name: "beautify",
            hint: "reformat selected JavaScript code in the editor",
            msg: "Beautifying selection.",
            bindKey: {mac: "Command-Shift-B", win: "Shift-Ctrl-B"},
            available : function(editor){
                if (apf.activeElement.localName == "codeeditor") {
                    var range = apf.activeElement.$editor.getSelectionRange();
                    return range.start.row == range.end.row 
                      && range.start.column == range.end.column
                }
                return false;
            },
            exec: function (editor) {
                _self.beautify(editor);
            }
        });

        settings.addSettings("JS Beautify", markupSettings);

        ide.addEventListener("loadsettings", function(e){
            settings.setDefaults("beautify/jsbeautify", [
                ["preserveempty", "true"],
                ["keeparrayindentation", "false"],
                ["jslinthappy", "false"],
                ["braces", "end-expand"],
                ["softtabs", "true"],
                ["tabsize", "4"]
            ]);
        });

        ext.initExtension(this);
    },

    enable: function () {
        this.nodes.each(function (item) {
            item.enable();
        });

        this.disabled = false;
    },

    disable: function () {
        this.nodes.each(function (item) {
            item.disable();
        });

        this.disabled = true;
    },

    destroy: function () {
        menus.remove("Tools/Beautify Selection");
        commands.removeCommand("beautify");

        this.nodes.each(function (item) {
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
