/**
 * JS Beautify for the Cloud9 IDE client
 * 
 * Inserts a context menu item under the "Edit" menu, which, upon being
 * clicked beautifies the selected code in the current tab
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

    var ext = require("core/ext");
    var ide = require("core/ide");
    var canon = require("pilot/canon");
    var editors = require("ext/editors/editors");
    var Range = require("ace/range").Range;
    var jsbeautify = require("ext/beautify/res/jsbeautify/jsbeautify");

    return ext.register("ext/beautify/beautify", {
        name: "JS Beautify",
        dev: "Ajax.org",
        alone: true,
        type: ext.GENERAL,

        commands: {
            "beautify": {
                hint: "reformat selected JavaScript code in the editor"
            }
        },

        nodes: [],
        hotitems: {},

        beautify: function() {
            var editor = editors.currentEditor;

            var sel = editor.getSelection();
            var doc = editor.getDocument();
            var range = sel.getRange();
            var value = doc.getTextRange(range);
            try {
                value = jsbeautify.js_beautify(value);
            } catch (e) {
                util.alert("Error", "This code could not be beautified", "Please correct any JavaScript errors and try again");
                return;
            }

            var end = doc.replace(range, value);
            sel.setSelectionRange(Range.fromPoints(range.start, end));
        },

        init: function() {},

        hook: function() {
            var _self = this;
            this.nodes.push(
            ide.mnuEdit.appendChild(new apf.divider()), ide.mnuEdit.appendChild(new apf.item({
                caption: "Beautify Selection",
                onclick: function() {
                    ext.initExtension(_self);
                    _self.beautify();
                }
            })));

            this.hotitems["beautify"] = [this.nodes[1]];
            canon.addCommand({
                name: "beautify",
                exec: function(env, args, request) {
                    _self.beautify();
                }
            });
        },

        enable: function() {
            this.nodes.each(function(item) {
                item.enable();
            });
        },

        disable: function() {
            this.nodes.each(function(item) {
                item.disable();
            });
        },

        destroy: function() {
            this.nodes.each(function(item) {
                item.destroy(true, true);
            });
            this.nodes = [];
        }
    });

});