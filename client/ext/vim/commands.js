"use strict";

define(function(require, exports, module) {

var util = require("ext/vim/maps/util");
var motions = require("ext/vim/maps/motions");
var operators = require("ext/vim/maps/operators");
var alias = require("ext/vim/maps/aliases");

var NUMBER    = 1;
var OPERATOR  = 2;
var MOTION    = 3;
var ACTION    = 4;

//var NORMAL_MODE = 0;
//var INSERT_MODE = 1;
//var VISUAL_MODE = 2;
var onVisualMode = false;

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
            onVisualMode = true;
            editor.selection.selectLine();
            editor.selection.selectLeft();
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
        }
        else if (motions[char] && this.isAccepting(MOTION)) {
            this.currentCmd = MOTION;

            var ctx = {
                operator: this.operator,
                motion: {
                    char: char,
                    count: this.getCount()
                },
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
                    count: this.getCount(),
                }
            };

            if (actions[char].param) {
                this.waitForParam(actionObj);
            }
            else {
                this.exec(editor, actionObj)
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
                if (onVisualMode && selectable) {
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
        this.motion = null;
        this.currentCount = "";

        this.accepting = [NUMBER, OPERATOR, MOTION, ACTION];
        this.idle = true;
        this.waitingForParam = null;
    }
};

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
    // insert mode.
    stop: {
        exec: function stop(editor) {
            inputBuffer.reset();
            onVisualMode = false;
            util.normalMode(editor);
        }
    },
    append: {
        exec: function append(editor) {
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

operators.v = function(editor, range, count, param) {
    onVisualMode = true;
};
});

