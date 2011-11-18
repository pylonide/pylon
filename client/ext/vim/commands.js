define(function(require, exports, module) {

"use strict";

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

var motions = {
    "w": {
        nav: function(editor) {
            editor.navigateWordRight();
        },
        sel: function(editor) {
            editor.selection.selectWordRight();
        }
    },
    "b": {
        nav: function(editor) {
            editor.navigateWordLeft();
        },
        sel: function(editor) {
            editor.selection.selectWordLeft();
        }
    },
    "l": {
        nav: function(editor) {
            editor.navigateRight();
        },
        sel: function(editor) {
            editor.selection.selectRight();
        }
    },
    "h": {
        nav: function(editor) {
            editor.navigateLeft();
        },
        sel: function(editor) {
            editor.selection.selectLeft();
        }
    },
    "k": {
        nav: function(editor) {
            editor.navigateUp();
        },
        sel: function(editor) {
            editor.selection.selectUp();
        }
    },
    "j": {
        nav: function(editor) {
            editor.navigateDown();
        },
        sel: function(editor) {
            editor.selection.selectDown();
        }
    },
    "f": {
        param: true,
        nav: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getRightNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.selection.clearSelection(); // Why does it select in the first place?
                ed.moveCursorTo(cursor.row, column + cursor.column + 1);
            }
        },
        sel: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getRightNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.moveCursorTo(cursor.row, column + cursor.column + 1);
            }
        }
    },
    "t": {
        param: true,
        nav: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getRightNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.selection.clearSelection(); // Why does it select in the first place?
                ed.moveCursorTo(cursor.row, column + cursor.column);
            }
        },
        sel: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getRightNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.moveCursorTo(cursor.row, column + cursor.column);
            }
        }
    },
    "x": {
        nav: function(editor, range, count, param) {
            var ed = editor;
            if (ed.selection.isEmpty()) {
                ed.selection.selectRight();
            }

            ed.session.remove(ed.getSelectionRange());
            ed.clearSelection();
        }
    },
    "shift-x": {
        nav: function(editor, range, count, param) {
            var ed = editor;
            if (ed.selection.isEmpty()) {
                ed.selection.selectLeft();
            }

            ed.session.remove(ed.getSelectionRange());
            ed.clearSelection();
        }
    },
    "shift-6": {
        nav: function(editor) {
            editor.navigateLineStart();
        },
        sel: function(editor) {
            editor.selection.selectLineStart();
        }
    },
    "shift-4": {
        nav: function(editor) {
            editor.navigateLineEnd();
        },
        sel: function(editor) {
            editor.selection.selectLineEnd();
        }
    },
    "0": {
        nav: function(editor) {
            var ed = editor;
            ed.navigateTo(ed.selection.selectionLead.row, 0);
        },
        sel: function(editor) {
            var ed = editor;
            ed.selectTo(ed.selection.selectionLead.row, 0);
        }
    },
    "shift-g": {
        nav: function(editor, range, count, param) {
            count = parseInt(count, 10);
            if (!count && count !== 0) { // Stupid JS
                count = editor.session.getLength();
            }
            editor.gotoLine(count);
        },
        sel: function(editor, range, count, param) {
            count = parseInt(count, 10);
            if (!count && count !== 0) {// Stupid JS
                count = editor.session.getLength();
            }
            editor.selectTo(count, 0);
        }
    },
    "g": {
        param: true,
        nav: function(editor, range, count, param) {
            switch(param) {
                case "m":
                    console.log("Middle line");
                    break;
                case "e":
                    console.log("End of prev word");
                    break;
                case "g":
                    editor.gotoLine(count || 0);
            }
        },
        sel: function(editor, range, count, param) {
            switch(param) {
                case "m":
                    console.log("Middle line");
                    break;
                case "e":
                    console.log("End of prev word");
                    break;
                case "g":
                    editor.selection.selectTo(count || 0, 0);
            }
        }
    },
    "o": {
        nav: function(editor, range, count, param) {
            count = count || 1;
            var content = "";
            while (0 < count--)
                content += "\n";

            if (content.length) {
                editor.navigateLineEnd()
                editor.insert(content);
            }
        }
    },
    "shift-o": {
        nav: function(editor, range, count, param) {
            count = count || 1;
            var content = "";
            while (0 < count--)
                content += "\n";

            if (content.length) {
                editor.navigateUp();
                editor.navigateLineEnd()
                editor.insert(content);
            }
        }
    }
};

var operators = {
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

    "r": function(editor, range, count, param) {
        count = parseInt(count || 1);
    }
};

var actions = {
    "z": function(editor, range, count, param) {
        switch (param) {
            case "z":
                // editor.scrollToRow()
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
            if (!o) {
                run(motionObj.nav);
            }
            else if (motionObj.sel) {
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
    // Start **insert** mode just after executing this command
    // Works like typing "i" in Normal mode.  When the ! is
    // included it works like "A", append to the line.
    // Otherwise insertion starts at the cursor position.
    // Note that when using this command in a function or
    // script, the insertion only starts after the function
    // or script is finished.
    // This command does not work from |:normal
    start: {
        description: 'Start **insert** mode',
        exec: function start(editor, params, request) {
            util.insertMode(editor);
        }
    },
    // Stop Insert mode as soon as possible. Works like typing <Esc> in
    // **insert** mode.
    stop: {
        description: 'Start **normal** mode',
        exec: function stop(editor, params, request) {
            util.normalMode(editor);
        }
    },
    // Append text after the cursor / word (if !) word.
    append: {
        description: 'Append text and start **normal** mode',
        exec: function append(editor, params, request) {
            editor.navigateRight(params.count);
            util.insertMode(editor);
        }
    }
};
});

