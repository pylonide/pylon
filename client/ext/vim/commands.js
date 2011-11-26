/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi AT c9 DOT io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

define(function(require, exports, module) {

var util = require("ext/vim/maps/util");
var motions = require("ext/vim/maps/motions");
var operators = require("ext/vim/maps/operators");
var alias = require("ext/vim/maps/aliases");
var registers = require("ext/vim/registers");

var NUMBER   = 1;
var OPERATOR = 2;
var MOTION   = 3;
var ACTION   = 4;

//var NORMAL_MODE = 0;
//var INSERT_MODE = 1;
//var VISUAL_MODE = 2;
//getSelectionLead

var searchStore = module.exports.searchStore = {
    current: "",
    options: {
        needle: "",
        backwards: false,
        wrap: true,
        caseSensitive: false,
        wholeWord: false,
        regExp: false
    }
};

var repeat = function repeat(fn, count, args) {
    count = parseInt(count);
    while (0 < count--)
        fn.apply(this, args);
};

var actions = {
    "z": {
        param: true,
        fn: function(editor, range, count, param) {
            switch (param) {
                case "z":
                    editor.centerSelection();
                    break;
            }
        }
    },
    "r": {
        param: true,
        fn: function(editor, range, count, param) {
            param = util.toRealChar(param);
            if (param && param.length) {
                repeat(function() { editor.insert(param); }, count || 1);
                editor.navigateLeft();
            }
        }
    },
    // Not truly like Vim's "VISUAL LINE" mode. Needs improvement.
    "shift-v": {
        fn: function(editor, range, count, param) {
            util.onVisualLineMode = true;
            editor.selection.selectLine();
            editor.selection.selectLeft();
        }
    },
    "shift-8": {
        fn: function(editor, range, count, param) {
            editor.selection.selectWord();
            var wordToSearch = editor.getCopyText();
            editor.find(wordToSearch, {
                needle: wordToSearch,
                backwards: false,
                wrap: true,
                caseSensitive: false,
                wholeWord: true,
                regExp: false
            });
            editor.selection.clearSelection();
            editor.navigateWordLeft();
        }
    },
    "shift-3": {
        fn: function(editor, range, count, param) {
            editor.selection.selectWord();
            var wordToSearch = editor.getCopyText();
            editor.find(wordToSearch, {
                needle: wordToSearch,
                backwards: true,
                wrap: true,
                caseSensitive: false,
                wholeWord: true,
                regExp: false
            });
            editor.selection.clearSelection();
            editor.navigateWordLeft();
        }
    },
    "n": {
        fn: function(editor, range, count, param) {
            editor.findNext(editor.getLastSearchOptions());
            editor.selection.clearSelection();
            //editor.navigateWordLeft();
        }
    },
    "shift-n": {
        fn: function(editor, range, count, param) {
            editor.findPrevious(editor.getLastSearchOptions());
            editor.selection.clearSelection();
            //editor.navigateWordLeft();
        }
    },
    "v": {
        fn: function(editor, range, count, param) {
            editor.selection.selectRight();
            util.onVisualMode = true;
            util.onVisualLineMode = false;
            var cursor = document.getElementsByClassName("ace_cursor")[0];
            cursor.style.display = "none";
        }
    },
    "shift-y": {
        fn: function(editor, range, count, param) {
            var pos = editor.getCursorPosition();
            editor.selection.clearSelection();
            editor.moveCursorTo(pos.row, pos.column);
            editor.selection.selectLine();
            registers._default.isLine = true;
            registers._default.text = editor.getCopyText();
            editor.selection.clearSelection();
            editor.moveCursorTo(pos.row, pos.column);
        }
    },
    "y": {
        fn: function(editor, range, count, param) {
            registers._default.text = editor.getCopyText();
            registers._default.isLine = false;
            editor.selection.clearSelection();
            util.normalMode(editor);
        }
    },
    "p": {
        fn: function(editor, range, count, param) {
            var defaultReg = registers._default;

            editor.setOverwrite(false);
            if (defaultReg.isLine) {
                var pos = editor.getCursorPosition();
                editor.session.getDocument().insertLines(pos.row + 1, [defaultReg.text]);
                editor.moveCursorTo(pos.row + 1, 0);
            }
            else {
                editor.navigateRight();
                editor.insert(defaultReg.text);
                editor.navigateLeft();
            }
            editor.setOverwrite(true);
            editor.selection.clearSelection();
        }
    },
    "shift-p": {
        fn: function(editor, range, count, param) {
            var defaultReg = registers._default;
            editor.setOverwrite(false);

            if (defaultReg.isLine) {
                var pos = editor.getCursorPosition();
                editor.session.getDocument().insertLines(pos.row, [defaultReg.text]);
                editor.moveCursorTo(pos.row, 0);
            }
            else {
                editor.insert(defaultReg.text);
            }
            editor.setOverwrite(true);
            editor.selection.clearSelection();
        }
    }
};

var inputBuffer = exports.inputBuffer = {
    accepting: [NUMBER, OPERATOR, MOTION, ACTION],
    currentCmd: null,
    //currentMode: 0,
    currentCount: "",

    // Types
    operator: null,
    motion: null,

    push: function(editor, char) {
        this.idle = false;
        var wObj = this.waitingForParam;
        if (wObj) {
            this.exec(editor, wObj, char);
        }
        // If input is a number (that doesn't start with 0)
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
            this.exec(editor, { operator: this.operator });
        }
        else if (motions[char] && this.isAccepting(MOTION)) {
            this.currentCmd = MOTION;

            var ctx = {
                operator: this.operator,
                motion: {
                    char: char,
                    count: this.getCount()
                }
            };

            if (motions[char].param)
                this.waitForParam(ctx);
            else
                this.exec(editor, ctx);
        }
        else if (alias[char] && this.isAccepting(MOTION)) {
            alias[char].operator.count = this.getCount();
            this.exec(editor, alias[char]);
        }
        else if (actions[char] && this.isAccepting(ACTION)) {
            var actionObj = {
                action: {
                    fn: actions[char].fn,
                    count: this.getCount()
                }
            };

            if (actions[char].param) {
                this.waitForParam(actionObj);
            }
            else {
                this.exec(editor, actionObj);
            }
        }
        else if (this.operator) {
            this.exec(editor, { operator: this.operator }, char);
        }
        else {
            this.reset();
        }
    },

    waitForParam: function(cmd) {
        this.waitingForParam = cmd;
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

        if (o && !editor.selection.isEmpty()) {
            if (operators[o.char].selFn) {
                operators[o.char].selFn(editor, editor.getSelectionRange(), o.count, param);
                this.reset();
            }
            return;
        }

        // There is an operator, but no motion or action. We try to pass the
        // current char to the operator to see if it responds to it (an example
        // of this is the 'dd' operator).
        else if (!m && !a && o && param) {
            operators[o.char].fn(editor, null, o.count, param);
            this.reset();
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
                if ((util.onVisualMode || util.onVisualLineMode) && selectable) {
                    run(motionObj.sel);
                }
                else {
                    run(motionObj.nav);
                    var pos = editor.getCursorPosition();
                    var lineLen = editor.session.getLine(pos.row).length;

                    // Solving the behavior at the end of the line due to the
                    // different 0 index-based colum positions in ACE.
                    if (lineLen && pos.column === lineLen)
                        editor.navigateLeft();
                }
            }
            else if (selectable) {
                repeat(function() {
                    run(motionObj.sel);
                    operators[o.char].fn(editor, editor.getSelectionRange(), o.count, param);
                }, o.count || 1);
            }
            this.reset();
        }
        else if (a) {
            a.fn(editor, editor.getSelectionRange(), a.count, param);
            this.reset();
        }
    },

    isAccepting: function(type) {
        return this.accepting.indexOf(type) !== -1;
    },

    reset: function() {
        this.operator = null;
        this.motion = null;
        this.currentCount = "";

        this.accepting = [NUMBER, OPERATOR, MOTION, ACTION];
        this.idle = true;
        this.waitingForParam = null;
    }
};

var commands = exports.commands = {
    commandLineCmd: {
        exec: function exec(editor) {
            editor.blur();
            txtConsoleInput.focus();
            txtConsoleInput.setValue(":");
        }
    },
    commandLineSearch: {
        exec: function exec(editor) {
            editor.blur();
            txtConsoleInput.focus();
            txtConsoleInput.setValue("/");
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
    // insert mode.
    stop: {
        exec: function stop(editor) {
            inputBuffer.reset();
            util.onVisualMode = false;
            util.onVisualLineMode = false;
            util.normalMode(editor);
        }
    },
    append: {
        exec: function append(editor) {
            var pos = editor.getCursorPosition();
            var lineLen = editor.session.getLine(pos.row).length;
            if (lineLen)
                editor.navigateRight();

            util.insertMode(editor);
        }
    },
    appendEnd: {
        exec: function appendEnd(editor) {
            editor.navigateLineEnd();
            util.insertMode(editor);
        }
    }
};
});
