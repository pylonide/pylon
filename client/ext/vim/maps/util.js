"use strict"

define(function(require, exports, module) {
module.exports = {
    insertMode: function(editor) {
        // Switch editor to insert mode
        var cursor = document.getElementsByClassName("ace_cursor")[0];

        editor.unsetStyle('normal-mode');
        cursor.style.backgroundColor = null;
        cursor.style.opacity = null;
        cursor.style.border = null;
        cursor.style.borderLeft = "2px solid black";

        editor.setOverwrite(false);
    },
    normalMode: function(editor) {
        // Switch editor to normal mode
        var cursor = document.getElementsByClassName("ace_cursor")[0];

        editor.setStyle('normal-mode');
        editor.clearSelection();
        cursor.style.backgroundColor = "red";
        cursor.style.opacity = ".5";
        cursor.style.border = "0";

        if (!editor.getOverwrite()) {
            editor.navigateLeft();
        }
        editor.setOverwrite(true);
    },
    getRightNthChar: function(editor, cursor, char, n) {
        var line = editor.getSession().getLine(cursor.row);
        var matches = line.substr(cursor.column + 1).split(char);

        return n < matches.length ? matches.slice(0, n).join(char).length : 0;
    },
    getLeftNthChar: function(env, cursor, char, n) {
        var line = editor.getSession().getLine(cursor.row);
        var matches = line.substr(0, cursor.column + 1).split(char);

        return n < matches.length ? matches.slice(-1 * n).join(char).length + 1: 0;
    }
};
});
