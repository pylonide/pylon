"use strict"

define(function(require, exports, module) {
module.exports = {
    "d": function(editor, range, count, param) {
        count = parseInt(count || 1, 10);
        switch (param) {
            case "d":
                for (var i=0; i<count; i++) {
                    editor.removeLines();
                }

                break;
            default:
                editor.session.remove(range);
        }
    },
    "c": function(editor, range, count, param) {
        count = parseInt(count || 1);
        switch (param) {
            case "c":
                for (var i=0; i<count; i++) {
                    editor.removeLines();
                    //insert mode
                }

                break;
            default:
                editor.session.remove(range);
            // insert mode
        }
    },
    "r": function(editor, range, count, param) {
        count = parseInt(count || 1);
    }
};
})
