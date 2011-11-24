define(function(require, exports, module) {

"use strict";

var util = require("ext/vim/maps/util");
var registers = require("ext/vim/registers");

module.exports = {
    "d": {
            selFn: function(editor, range, count, param) {
                registers._default.text = editor.getCopyText();
                registers._default.isLine = false;
                editor.session.remove(range);
                util.normalMode(editor);
            },
            fn: function(editor, range, count, param) {
                count = parseInt(count || 1, 10);
                switch (param) {
                    case "d":
                        registers._default.text = "";
                        registers._default.isLine = true;
                        for (var i=0; i<count; i++) {
                            editor.selection.selectLine();
                            registers._default.text += editor.getCopyText();
                            var selRange = editor.getSelectionRange();
                            editor.session.remove(selRange);
                            editor.selection.clearSelection();
                        }

                        break;
                    default:
                        if (range) {
                            editor.selection.setSelectionRange(range);
                            registers._default.text = editor.getCopyText();
                            registers._default.isLine = false;
                            editor.session.remove(range);
                            editor.selection.clearSelection();
                        }
                }
            }
    },
    "c": {
            selFn: function(editor, range, count, param) {
                editor.session.remove(range);
                util.insertMode(editor);
            },
            fn: function(editor, range, count, param) {
                count = parseInt(count || 1, 10);
                switch (param) {
                    case "c":
                        for (var i=0; i < count; i++) {
                            editor.removeLines();
                            util.insertMode(editor);
                        }

                        break;
                    default:
                        if (range) {
                            editor.session.remove(range);
                            util.insertMode(editor);
                        }
                }
            }
    }
};
});
