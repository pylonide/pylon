"use strict";

define(function(require, exports, module) {

var StateHandler = require("ace/keyboard/state_handler").StateHandler;
var cmds = require("ext/vim/commands");
var editors = require("ext/editors/editors");

var matchChar = function(buffer, hashId, key, symbolicName) {
    // If no command keys are pressed, then catch the input.
    // If only the shift key is pressed and a character key, then
    // catch that input as well.
    // Otherwise, we let the input got through.
    var matched = ((hashId === 0) || (((hashId === 1) || (hashId === 4)) && key.length === 1));
    //console.log("INFO", buffer, hashId, key, symbolicName, matched)

    if (matched) {
        var editor = editors.currentEditor.ceEditor.$editor;
        editor.commands.addCommand({
            name: "builder",
            exec: function(editor) {
                cmds.inputBuffer.push.call(cmds.inputBuffer, editor, symbolicName);
            }
        });
    }
    return matched;
};

var inIdleState = function() {
    if (cmds.inputBuffer.idle) {
        return true;
    }
    return false;
};

var states = exports.states = {
    start: [ // normal mode
        {
            key: "esc",
            exec: "stop",
            then: "start"
        },
        {
            regex: "^(:|shift-º)$", // Ace doesn't always reacts to ':'
            exec: "commandLineCmd"
        },
        {
            regex: "^/$",
            exec: "commandLineSearch"
        },
        {
            regex: "^u$",
            exec: "undo"
        },
        {
            regex: "^i$",
            match: inIdleState,
            exec: "start",
            then: "insertMode"
        },
        {
            regex: "^shift-i$",
            match: inIdleState,
            exec: "startBeginning",
            then: "insertMode"
        },
        {
            regex: "^a$",
            match: inIdleState,
            exec: "append",
            then: "insertMode"
        },
        {
            regex: "^shift-a$",
            match: inIdleState,
            exec: "appendEnd",
            then: "insertMode"
        },
        {
            comment: "Catch some keyboard input to stop it here",
            match: matchChar,
            exec: "builder"
        }
    ],
    insertMode: [
        {
            key: "esc",
            exec: "stop",
            then: "start"
        },
        {
            key: "backspace",
            exec: "backspace"
        }
    ]
};

exports.handler = new StateHandler(states);
});
