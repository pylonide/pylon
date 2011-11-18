define(function(require, exports, module) {

var StateHandler = require("ace/keyboard/state_handler").StateHandler;
var cmds = require("ext/vim/commands");
var editors = require("ext/editors/editors");

var matchChar = function(buffer, hashId, key, symbolicName) {
    // If no command keys are pressed, then catch the input.
    // If only the shift key is pressed and a character key, then
    // catch that input as well.
    // Otherwise, we let the input got through.
    var matched = ((hashId == 0) || ((hashId == 4) && key.length == 1));
    console.log("INFO", buffer, hashId, key, symbolicName, matched)

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

var states = exports.states = {
    start: [ // normal mode
        {
            key: "esc",
            exec: "stop",
            then: "start"
        },
        {
            // That's fucked up
            regex: "^shift-º$",
            exec: "commandLine"
        },
        {
            regex: "^/$",
            exec: "commandLine"
        },
        {
            regex: "^u$",
            exec: "undo"
        },
        {
            regex:  "^i$",
            exec: "start",
            then: "insertMode"
        },
        {
            regex: "^shift-i$",
            exec: "start",
            then: "insertMode"
        },
        {
            regex: "^a$",
            exec: "append",
            then: "insertMode"
        },
        {
            regex: "^shift-a$",
            exec: "append",
            then: "insertMode"
        },
        {
            regex:  [ "backspace" ],
            exec:   "moveBack",
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
