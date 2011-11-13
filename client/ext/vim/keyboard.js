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
            name: "builder1",
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
        regex: "^:$",
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
/*    {*/
        //regex: [ types.count.regex, "o" ],
        //params: [ types.count ],
        //exec: "openNewLines",
        //then: "insertMode"
    //},
    //{
        //regex: [ types.count.regex, "shift-o" ],
        //params: [ types.count, types.bang ],
        //exec: "openNewLines",
        //then: "insertMode"
    //},
    //{
        //regex: [ types.count.regex, "s" ],
        //params: [ types.count ],
        //exec: "substitute",
        //then: "insertMode"
    //},
    //{
        //regex: [ types.count.regex, "shift-s" ],
        //params: [ types.count, types.bang ],
        //exec: "substitute",
        //then: "insertMode"
    /*},*/
/*    {*/
        //regex:  [ types.count.regex, "k" ],
        //params: [ types.count ],
        //exec:   "moveUp"
    //},
    //{
        //regex: [ types.count.regex, "j" ],
        //exec:   "moveDown",
        //params: [ types.count ]
    /*},*/
/*    {*/
        //regex:  [ types.count.regex, "l" ],
        //exec: "moveForward",
        //params: [ types.count ]
    /*},*/
    {
        regex:  [ types.count.regex, "backspace" ],
        exec:   "moveBack",
        params: [ types.count ]
    },
/*    {*/
        //key: null,
        //regex: [ types.count.regex, "t", types.char.regex ],
        //exec: "moveForwardTo",
        //params: [ types.count, types.char ]
    //},
    //{
        //key: null,
        //regex: [ types.count.regex, "shift-t", types.char.regex ],
        //exec: "moveBackwardTo",
        //params: [ types.count, types.char ]
    //},
    //{
        //key: null,
        //regex: [ types.count.regex, "f", types.char.regex ],
        //exec: "moveForwardAt",
        //params: [ types.count, types.char ]
    //},
    //{
        //key: null,
        //regex: [ types.count.regex, "shift-f", types.char.regex ],
        //exec: "moveBackwardAt",
        //params: [ types.count, types.char ]
    //},
    //{
        //regex: [ types.count.regex, "d", "d" ],
        //exec: "deleteLines",
        //params: [ types.count ]
    /*},*/
/*    {*/
        //regex: [ types.line.regex, "shift-g" ],
        //exec: "gotoLine",
        //params: [ types.line ]
    /*},*/
/*    {*/
        //regex: [ types.line.regex, "gg" ],
        //exec: "gotoLine",
        //params: [ types.line ]
    /*},*/
/*    {*/
        //regex: "^shift-4$",
        //exec: "gotolineend"
    //},
    //{
        //regex: "^shift-6$",
        //exec: "gotolinestart"
    /*},*/
/*    {*/
        //regex: "^0$",
        //exec: "moveToFirstChar"
    /*},*/
/*    {*/
        //regex: [ types.count.regex, "(e|shift-e)" ],
        //exec: "goToEndWord",
        //params: [ types.count ]
    //},
    //{
        //regex: [ types.count.regex, "(b|shift-b)" ],
        //exec: "goToBackWord",
        //params: [ types.count ]
    //},
    //{
        //regex: "^shift-g$",
        //exec: "gotoend"
    //},
    //{
        //regex: "^gg$",
        //exec: "gotostart"
    //},
    //{
        //regex: "^(zz|z.)$",
        //exec: "centerselection"
    //},
    //{
        //regex: [ types.count.regex, "x" ],
        //exec: "deleteChar",
        //params: [ types.count ]
    //},
    //{
        //regex: [ types.count.regex, "shift-x" ],
        //exec: "deleteCharBack",
        //params: [ types.count ]
    //},
    //{
        //regex: "command-s",
        //exec: "write"
    //},
    //{
        //regex: "shift-m",
        //exec: "moveToMiddleWindow"
    //},
    //{
        //regex: [ types.count.regex, "^shift-h$" ],
        //exec: "lineFromStart",
        //params: [ types.count ]
    //},
    //{
        //regex: [ types.count.regex, "^shift-l$" ],
        //exec: "lineFromEnd",
        //params: [ types.count ]
    //},
    //{
        //regex: [ types.count.regex, "^shift-\\$" ],
        //exec: "moveToColumn",
        //params: [ types.count ]
    /*},*/
    {
        comment: "Catch some keyboard input to stop it here",
        match: matchChar,
        exec: "builder1"
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
