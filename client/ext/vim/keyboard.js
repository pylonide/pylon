define(function(require, exports, module) {

var types = require("ext/vim/params");
var StateHandler = require("ace/keyboard/state_handler").StateHandler;
var cmds = require("ext/vim/commands");
var canon = require("pilot/canon");

var matchChar = function(buffer, hashId, key, symbolicName) {
    // If no command keys are pressed, then catch the input.
    // If only the shift key is pressed and a character key, then
    // catch that input as well.
    // Otherwise, we let the input got through.
    var matched = ((hashId == 0) || ((hashId == 4) && key.length == 1));
    console.log("INFO", buffer, hashId, key, symbolicName, matched)

    if (matched) {
        canon.addCommand({
            name: "builder",
            exec: function(env, params, request) {
                cmds.inputBuffer.push.call(cmds.inputBuffer, env, symbolicName);
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
            params: [ types.count ],
            exec: "start",
            then: "insertMode"
        },
        {
            regex: "^shift-i$",
            params: [ types.bang ],
            exec: "start",
            then: "insertMode"
        },
        {
            regex: "^a$",
            params: [ types.count ],
            exec: "append",
            then: "insertMode"
        },
        {
            regex: "^shift-a$",
            params: [ types.count, types.bang ],
            exec: "append",
            then: "insertMode"
        },
        {
            regex:  [ types.count.regex, "backspace" ],
            exec:   "moveBack",
            params: [ types.count ]
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
