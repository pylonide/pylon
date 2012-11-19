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

        if (editor.amlEditor)
            editor = editor.amlEditor.$editor;

        var sel = editor.selection;
        var session = editor.session;
        var range = sel.getRange();

        // Load up current settings data
        var options = {};
        options.space_before_conditional = apf.isTrue(settings.model.queryValue("beautify/jsbeautify/@space_before_conditional"));
        options.keep_array_indentation = apf.isTrue(settings.model.queryValue("beautify/jsbeautify/@keeparrayindentation"));
        options.preserve_newlines = apf.isTrue(settings.model.queryValue("beautify/jsbeautify/@preserveempty"));
        options.unescape_strings = apf.isTrue(settings.model.queryValue("beautify/jsbeautify/@unescape_strings"));
        options.jslint_happy = apf.isTrue(settings.model.queryValue("beautify/jsbeautify/@jslinthappy"));
        options.brace_style = settings.model.queryValue("beautify/jsbeautify/@braces");

        if (session.getUseSoftTabs()) {
            options.indent_char = " ";
            options.indent_size = session.getTabSize();
        } else {
            options.indent_char = "\t";
            options.indent_size = 1;
        }

        var line = session.getLine(range.start.row);
        var indent = line.match(/^\s*/)[0];
        var trim = false;

        if (range.start.column < indent.length)
            range.start.column = 0;
        else
            trim = true;


        var value = session.getTextRange(range);
        var syntax = session.syntax;
        var type = null;

        if (syntax == "javascript") {
            type = "js";
        } else if (syntax == "css") {
            type = "css";
        } if (/^\s*<!?\w/.test(value)) {
            type = "html";
        } else if (syntax == "xml") {
            type = "html";
        } else if (syntax == "html") {
            if (/[^<]+?{[\s\-\w]+:[^}]+;/.test(value))
                type = "css";
            else if (/<\w+[ \/>]/.test(value))
                type = "html";
            else
                type = "js";
        }

        try {
            value = jsbeautify[type + "_beautify"](value, options);
            if (trim)
                value = value.replace(/^/gm, indent).trim();
            if (range.end.column == 0)
                value += "\n" + indent;
        }
        catch (e) {
            util.alert("Error",
                "This code could not be beautified",
                '"' + syntax + "\" is not supported yet");
            return;
        }

        var end = session.replace(range, value);
        sel.setSelectionRange(Range.fromPoints(range.start, end));
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
            isAvailable : function(editor){
                if (editor && editor.path == "ext/code/code") {
                    var range = editor.amlEditor.$editor.getSelectionRange();
                    return range.start.row != range.end.row
                      || range.start.column != range.end.column;
                }
                return false;
            },
            exec: function (editor) {
                _self.beautify(editor);
            }
        });

        settings.addSettings("JS Beautify", markupSettings);

        ide.addEventListener("settings.load", function(e){
            settings.setDefaults("beautify/jsbeautify", [
                ["preserveempty", "true"],
                ["keeparrayindentation", "false"],
                ["jslinthappy", "false"],
                ["braces", "end-expand"],
                ["space_before_conditional", "true"],
                ["unescape_strings", "true"]
            ]);
        });

        ext.initExtension(this);
    },

    destroy: function () {
        menus.remove("Tools/Beautify Selection");
        commands.removeCommand("beautify");
        this.$destroy();
    }
});

});
