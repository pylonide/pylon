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
        "save" : {
            "quicksave": "Ctrl-S",
            "saveas": "Ctrl-Shift-S",
            "reverttosaved": "Ctrl-Shift-Q"
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
        "debugger": {
            "resume": "F8",
            "stepinto": "F11",
            "stepover": "F10",
            "stepout": "Shift-F11"
        },
        "zen": {
            "zen": "Ctrl-E",
            "zenslow": "Ctrl-Shift-E"
        },
        "gotoline": {
            "gotoline": "Ctrl-G"
        },
        "beautify": {
            "beautify": "Ctrl-Shift-B"
        },
        "gotofile": {
            "gotofile": "Alt-Shift-R"
        },
        "newresource": {
            "newfile": "Ctrl-N",
            "newfiletemplate": "Ctrl-Shift-N",
            "newfolder": "Ctrl-Alt-N"
        },
        "quicksearch": {
            "find": "Ctrl-F",
            "findnext": "Ctrl-K",
            "findprevious": "Ctrl-Shift-K"
        },
        "searchreplace" : {
            "search": "Ctrl-Shift-F",
            "searchreplace": "Ctrl-Shift-R"
        },
        "searchinfiles" : {
            "searchinfiles": "Alt-Shift-F"
        },
        "formatjson" : {
            "format" : "Ctrl-Shift-J"
        },
        "settings": {
            "showsettings": "Ctrl-,"
        },
        "tabbehaviors" : {
            "closetab": "Ctrl-W",
            "closealltabs": "Ctrl-Shift-W",
            "closeallbutme": "Ctrl-Alt-W",
            "gototabright": "Ctrl-]",
            "gototableft": "Ctrl-[",
            "tab1": "Ctrl-1",
            "tab2": "Ctrl-2",
            "tab3": "Ctrl-3",
            "tab4": "Ctrl-4",
            "tab5": "Ctrl-5",
            "tab6": "Ctrl-6",
            "tab7": "Ctrl-7",
            "tab8": "Ctrl-8",
            "tab9": "Ctrl-9",
            "tab0": "Ctrl-0",
            "revealtab": "Ctrl-Shift-L",
            "nexttab": "Ctrl-Tab",
            "previoustab": "Ctrl-Shift-Tab"
        },
        "tabsessions" : {
            "savetabsession": "Ctrl-Alt-S"
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
            "replace": "Ctrl-Shift-R",
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
        },
        "language": {
            "complete": "Ctrl-Space|Alt-Space",
            "renameVar": "Ctrl-Alt-R"
        }
    }
});

});
