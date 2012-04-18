/**
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var keys = require("ext/keybindings/keybindings");

return keys.onLoad({
    "ext" : {
        "console" : {
            "switchconsole": "Shift-Esc"
        },
        "revisions" : {
            "show": "Ctrl-B"
        },
        "undo" : {
            "undo": "Ctrl-Z",
            "redo": "Ctrl-Y"
        },
        "clipboard" : {
            "cut": "Ctrl-X",
            "copy": "Ctrl-C",
            "paste": "Ctrl-V"
        },
        "quickwatch": {
            "quickwatch": "Ctrl-Q"
        },
        "runpanel": {
            "run" : "Ctrl-F5",
            "stop" : "Shift-F5"
        },
        "zen": {
            "zen": "Alt-E",
            "zenslow": "Alt-Shift-E"
        },
        "searchreplace" : {
            //"search": "Ctrl-Shift-F",
            "searchreplace": "Alt-Shift-F"
        },
        "searchinfiles" : {
            "searchinfiles": "Ctrl-Shift-F"
        },
        "formatjson" : {
            "format" : "Ctrl-Shift-J"
        },
        "tabsessions" : {
            "savetabsession": "Ctrl-Alt-S"
        },
        "tree" : {
            "show" : "Ctrl-U"
        },
        "settings": {
            "show": "Ctrl-,"
        },
        "splitview" : {
            "mergetableft": "Ctrl-Alt-[",
            "mergetabright": "Ctrl-Alt-]"
        },
        "code" : {
            "selectall": "Ctrl-A",
            "removeline": "Ctrl-D",
            "gotoline": "Ctrl-G",
            "togglecomment": "Ctrl-7",
            "findnext": "F3",
            "findprevious": "Shift-F3",
            "find": "Ctrl-F",
            "replace": "Alt-Shift-F",
            "undo": "Ctrl-Z",
            "redo": "Ctrl-Shift-Z|Ctrl-Y",
            "overwrite": "Insert",
            "copylinesup": "Ctrl-Alt-Up",
            "movelinesup": "Ctrl-Up",
            "selecttostart": "Ctrl-Shift-Up",
            "gotostart": "Ctrl-Home",
            "selectup": "Shift-Up",
            "golineup": "Up",
            "copylinesdown": "Ctrl-Alt-Down",
            "movelinesdown": "Ctrl-Down",
            "selecttoend": "Ctrl-Shift-Down",
            "gotoend": "Ctrl-End",
            "selectdown": "Shift-Down",
            "golinedown": "Down",
            "selectwordleft": "Ctrl-Shift-Left",
            "gotowordleft": "Ctrl-Left",
            "selecttolinestart": "Alt-Shift-Left",
            "gotolinestart": "Alt-Left|Home",
            "selectleft": "Shift-Left",
            "gotoleft": "Left",
            "selectwordright": "Ctrl-Shift-Right",
            "gotowordright": "Ctrl-Right",
            "selecttolineend": "Alt-Shift-Right",
            "gotolineend": "Alt-Right|End",
            "selectright": "Shift-Right",
            "gotoright": "Right",
            "selectpagedown": "Shift-PageDown",
            "pagedown": "PageDown",
            "selectpageup": "Shift-PageUp",
            "pageup": "PageUp",
            "selectlinestart": "Shift-Home",
            "selectlineend": "Shift-End",
            "del": "Delete",
            "backspace": "Backspace",
            "outdent": "Shift-Tab",
            "indent": "Tab"
        }
    }
});

});
