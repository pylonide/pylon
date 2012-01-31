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
var code = require("ext/code/code");
var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var jsbeautify = require("ext/beautify/res/jsbeautify/jsbeautify-min");
var settings = require("text!ext/beautify/settings.xml");
var extSettings = require("ext/settings/settings");

module.exports = ext.register("ext/beautify/beautify", {
    name: "JS Beautify",
    dev: "Ajax.org",
    alone: true,
    type: ext.GENERAL,

    commands: {
        "beautify": {
            hint: "reformat selected JavaScript code in the editor",
            msg: "Beautifying selection."
        }
    },

    nodes: [],
    hotitems: {},

    beautify: function () {
        var editor = editors.currentEditor;

        var sel = editor.getSelection();
        var doc = editor.getDocument();
        var range = sel.getRange();
        var value = doc.getTextRange(range);

        // Load up current settings data
        var preserveEmpty = apf.isTrue(extSettings.model.queryValue("beautify/jsbeautify/@preserveempty"));
        var keepIndentation = apf.isTrue(extSettings.model.queryValue("beautify/jsbeautify/@keeparrayindentation"));
        var jsLintHappy = apf.isTrue(extSettings.model.queryValue("beautify/jsbeautify/@jslinthappy"));
        var braces = extSettings.model.queryValue("beautify/jsbeautify/@braces") || "end-expand";
        var indentSize = extSettings.model.queryValue("editors/code/@tabsize");
        var indentTab = apf.isTrue(extSettings.model.queryValue("editors/code/@softtabs")) ? " " : "\t";

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
        
    },

    hook: function () {
        var _self = this;
        this.nodes.push(
        ide.mnuEdit.appendChild(new apf.divider()), ide.mnuEdit.appendChild(new apf.item({
            caption: "Beautify Selection",
            onclick: function () {
                ext.initExtension(_self);
                _self.beautify();
            }
        })));

        this.hotitems.beautify = [this.nodes[1]];
        code.commandManager.addCommand({
            name: "beautify",
            exec: function () {
                _self.beautify();
            }
        });

        ide.addEventListener("init.ext/settings/settings", function (e) {
            var heading = e.ext.getHeading("JS Beautify");
            heading.insertMarkup(settings);
        });
        
        ide.addEventListener("loadsettings", function(e){
            var model = e.model;
            
            if (!model.queryNode("beautify/jsbeautify")) {
                model.setQueryValue("beautify/jsbeautify/@preserveempty", "true");
                model.setQueryValue("beautify/jsbeautify/@keeparrayindentation", "false");
                model.setQueryValue("beautify/jsbeautify/@jslinthappy", "false");
                model.setQueryValue("beautify/jsbeautify/@braces", "end-expand");
                model.setQueryValue("editors/code/@tabsize", "4");
                model.setQueryValue("editors/code/@softtabs", "true");
            }
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