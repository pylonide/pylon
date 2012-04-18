/**
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {
"use strict";

var keys = require("ext/keybindings/keybindings");

return keys.onLoad({
    "ext" : {
        "console" : {
            "switchconsole": "Shift-Esc"
        },
        "revisions" : {
            "revisions": "Command-B"
        },
        "undo" : {
            "undo": "Command-Z",
            "redo": "Shift-Command-Z"
        },
        "clipboard" : {
            "cut": "Shift-Command-X",
            "copy": "Command-C",
            "paste": "Command-V"
        },
        "quickwatch": {
            "quickwatch": "Option-Q"
        },
        "runpanel": {
            "run" : "F5",
            "stop" : "Shift-F5"
        },
        "zen": {
            "zen": "Option-Z",
            "zenslow": "Shift-Option-Z"
        },
        "searchreplace" : {
            //"search": "Shift-Command-F",
            "searchreplace": "Option-Command-F"
        },
        "searchinfiles" : {
            "searchinfiles": "Shift-Command-F"
        },
        "formatjson" : {
            "format" : "Shift-Command-J"
        },
        "tabsessions" : {
            "savetabsession": "Command-Alt-S"
        },
        "tree" : {
            "show" : "Command-U"
        },
        "settings": {
            "show": "Command-,"
        },
        "splitview" : {
            "mergetableft": "Option-Command-[",
            "mergetabright": "Option-Command-]"
        },
        "code" : {
            "selectall": "Command-A",
            "removeline": "Command-D",
            "togglecomment": "Command-/",
            "findnext": "Command-G",
            "findprevious": "Shift-Command-G",
            "find": "Command-F",
            "replace": "Option-Shift-F",
            "undo": "Command-Z",
            "redo": "Shift-Command-Z|Command-Y",
            "overwrite": "Insert",
            "copylinesup": "Option-Command-Up",
            "movelinesup": "Option-Up",
            "selecttostart": "Shift-Command-Up",
            "gotostart": "Command-Home|Command-Up",
            "selectup": "Shift-Up",
            "golineup": "Up",
            "copylinesdown": "Option-Command-Down",
            "movelinesdown": "Option-Down",
            "selecttoend": "Shift-Command-Down",
            "gotoend": "Command-End|Command-Down",
            "selectdown": "Shift-Down",
            "golinedown": "Down",
            "selectwordleft": "Option-Shift-Left",
            "gotowordleft": "Option-Left",
            "selecttolinestart": "Shift-Command-Left",
            "gotolinestart": "Command-Left|Home",
            "selectleft": "Shift-Left",
            "gotoleft": "Left",
            "selectwordright": "Option-Shift-Right",
            "gotowordright": "Option-Right",
            "selecttolineend": "Shift-Command-Right",
            "gotolineend": "Command-Right|End",
            "selectright": "Shift-Right",
            "gotoright": "Right",
            "gotopagedown": "Command-PageDown",
            "selectpagedown": "Shift-PageDown",
            "pagedown": "PageDown",
            "gotopageup": "Command-PageUp",
            "selectpageup": "Shift-PageUp",
            "pageup": "PageUp",
            "selectlinestart": "Shift-Home",
            "selectlineend": "Shift-End",
            "del": "Delete",
            "backspace": "Command-Backspace|Option-Backspace|Backspace",
            "outdent": "Shift-Tab",
            "indent": "Tab"
        }
    }
});

});
