"use strict"

define(function(require, exports, module) {
module.exports = {
    "d": {
            selFn: function(editor, range, count, param) {
                editor.session.remove(range);
            },
            fn: function(editor, range, count, param) {
                count = parseInt(count || 1, 10);
                switch (param) {
                    case "d":
                        for (var i=0; i<count; i++) {
                            editor.removeLines();
                        }

                        break;
                    default:
                        if (range) {
                            editor.session.remove(range);
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
                count = parseInt(count || 1);
                switch (param) {
                    case "c":
                        for (var i=0; i < count; i++) {
                            editor.removeLines();
                            util.insertMode(editor)
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
})
