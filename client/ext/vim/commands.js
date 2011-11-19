"use strict";



define(function(require, exports, module) {

var motions = require("ext/vim/maps/motions");
var operators = require("ext/vim/maps/operators");
var alias = require("ext/vim/maps/aliases");

var onVisuaMode = false;

var util = exports.util = {
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
        inputBuffer.reset();
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

var NUMBER    = 1;
var OPERATOR  = 2;
var MOTION    = 3;
var ACTION    = 4;
var SELECTION = 5;


var actions = {
    "z": function(editor, range, count, param) {
        switch (param) {
            case "z":
                editor.centerSelection();
                break;
        }
    }
};

var repeat = function repeat(fn, count, args) {
    while (0 < count--)
        fn.apply(this, args);
};

var inputBuffer = exports.inputBuffer = {
    accepting: [NUMBER, OPERATOR, MOTION, ACTION],
    currentCmd: null,
    currentCount: "",

    // Types
    operator: null,
    motion: null,
    selection: null,

    push: function(editor, char) {
            console.log("CHAR", char);
        var wObj = this.waitingForParam;
        if (wObj) {
            this.exec(editor, wObj, char);
            this.waitingForParam = null;
        }
        // If it is a number (that doesn't start with 0)
        else if (!(char === "0" && !this.currentCount.length) &&
            (char.match(/^\d+$/) && this.isAccepting(NUMBER))) {
            // Assuming that char is always of type String, and not Number
            this.currentCount += char;
            this.currentCmd = NUMBER;
            this.accepting = [NUMBER, OPERATOR, MOTION, ACTION];
        }
        else if (!this.operator && this.isAccepting(OPERATOR) && operators[char]) {
            this.operator = {
                char: char,
                count: this.getCount()
            };
            this.currentCmd = OPERATOR;
            this.accepting = [NUMBER, MOTION, ACTION];
        }
        else if (motions[char] && this.isAccepting(MOTION)) {
            this.currentCmd = MOTION;

            var ctx = {
                operator: this.operator,
                selection: this.selection,
                motion: {
                    char: char,
                    count: this.getCount()
                },
            };

            if (motions[char].param)
                this.waitingForParam = ctx;
            else
                this.exec(editor, ctx);
        }
        else if (alias[char] && this.isAccepting(MOTION)) {
            alias[char].operator.count = this.getCount();
            this.exec(editor, alias[char]);
        }
        else if (actions[char] && this.isAccepting(ACTION)) {
            this.waitingForParam = {
                action: {
                    fn: actions[char],
                    count: this.getCount(),
                }
            };
        }
        else if (this.operator) {
            console.log("this operator")
            this.exec(editor, { operator: this.operator }, char);
        }
        else {
            this.reset();
        }
    },

    getCount: function() {
        var count = this.currentCount;
        this.currentCount = "";
        return count;
    },

    exec: function(editor, action, param) {
        var m = action.motion;
        var o = action.operator;
        var a = action.action;

        // There is an operator, but no motion or action. We try to pass the
        // current char to the operator to see if it responds to it (an example
        // of this is the 'dd' operator).
        if (!m && !a && o) {
            operators[o.char](editor, editor.getSelectionRange(), o.count, param);
        }
        else if (m) {
            var run = function(fn) {
                if (fn && typeof fn === "function") { // There should always be a motion
                    if (m.count)
                        repeat(fn, m.count, [editor, null, m.count, param]);
                    else
                        fn(editor, null, m.count, param);
                }
            };

            var motionObj = motions[m.char];
            var selectable = motionObj.sel;
            if (!o) {
                if (onVisuaMode && selectable) {
                    run(motionObj.sel);
                }
                else {
                    run(motionObj.nav);
                }
            }
            else if (selectable) {
                repeat(function() {
                    run(motionObj.sel);
                    operators[o.char](editor, editor.getSelectionRange(), o.count, param);
                }, o.count || 1);
            }
        }
        else if (a) {
            a.fn(editor, editor.getSelectionRange(), a.count, param);
        }
        this.reset();
    },

    isAccepting: function(type) {
        return this.accepting.indexOf(type) !== -1;
    },

    reset: function() {
        this.operator = null;
        this.selection = null;
        this.motion = null;
        this.currentCount = "";

        this.accepting = [NUMBER, OPERATOR, MOTION, ACTION];
    }
}

var commands = exports.commands = {
    commandLine: {
        exec: function exec(editor) {
            editor.blur();
            txtConsoleInput.focus();
            txtConsoleInput.setValue(":");
        }
    },
    start: {
        exec: function start(editor) {
            util.insertMode(editor);
        }
    },
    startBeginning: {
        exec: function start(editor) {
            editor.navigateLineStart();
            util.insertMode(editor);
        }
    },
    // Stop Insert mode as soon as possible. Works like typing <Esc> in
    // **insert** mode.
    stop: {
        exec: function stop(editor) {
            onVisuaMode = false;
            util.normalMode(editor);
        }
    },
    append: {
        exec: function append(editor) {
            editor.navigateRight(params.count);
            util.insertMode(editor);
        }
    },
    appendEnd: {
        exec: function appendEnd(editor) {
            editor.navigateLineEnd();
            util.insertMode(editor);
        }
    },
    visual: {
        exec: function visual(editor) {
            onVisuaMode = true;
        }
    }
};
});

