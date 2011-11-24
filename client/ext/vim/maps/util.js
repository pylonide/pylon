"use strict";

define(function(require, exports, module) {
module.exports = {
    onVisualMode: false,
    onVisualLineMode: false,
    insertMode: function(editor) {
        // Switch editor to insert mode
        var cursor = document.getElementsByClassName("ace_cursor")[0];

        editor.unsetStyle('insert-mode');
        cursor.style.display = null;
        cursor.style.backgroundColor = null;
        cursor.style.opacity = null;
        cursor.style.border = null;
        cursor.style.borderLeft = "2px solid black";

        editor.setOverwrite(false);
        editor.keyBinding.$data.buffer = "";
        editor.keyBinding.$data.state = "insertMode";
        this.onVisualMode = false;
        this.onVisualLineMode = false;
    },
    normalMode: function(editor) {
        // Switch editor to normal mode
        var cursor = document.getElementsByClassName("ace_cursor")[0];

        editor.setStyle('normal-mode');
        editor.clearSelection();
        cursor.style.display = null;
        cursor.style.backgroundColor = "red";
        cursor.style.opacity = ".5";
        cursor.style.border = "0";

        var pos;
        if (!editor.getOverwrite()) {
            pos = editor.getCursorPosition();
            if (pos.column > 0)
                editor.navigateLeft();
        }
        editor.setOverwrite(true);
        editor.keyBinding.$data.buffer = "";
        editor.keyBinding.$data.state = "start";
        this.onVisualMode = false;
        this.onVisualLineMode = false;
    },
    getRightNthChar: function(editor, cursor, char, n) {
        var line = editor.getSession().getLine(cursor.row);
        var matches = line.substr(cursor.column + 1).split(char);

        return n < matches.length ? matches.slice(0, n).join(char).length : 0;
    },
    getLeftNthChar: function(editor, cursor, char, n) {
        var line = editor.getSession().getLine(cursor.row);
        var matches = line.substr(0, cursor.column + 1).split(char);

        return n < matches.length ? matches.slice(-1 * n).join(char).length + 1: 0;
    },
    toRealChar: function(char) {
        if (char.length === 1)
            return char;

        if (/^shift-./.test(char))
            return char[char.length - 1].toUpperCase();
        else
            return "";
    }
};
});
