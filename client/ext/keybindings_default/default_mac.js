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
            "quicksave": "Command-S",
            "saveas": "Command-Shift-S",
	    "reverttosaved": "Command-Shift-Q"
        },
        "undo" : {
            "undo": "Command-Z",
            "redo": "Command-Shift-Z"
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
        "debugger": {
            "resume": "F8",
            "stepinto": "F11",
            "stepover": "F10",
            "stepout": "Shift-F11"
        },
        "zen": {
            "zen": "Command-E",
            "zenslow": "Command-Shift-E"
        },
        "gotoline": {
           "gotoline": "Command-L"
        },
        "beautify": {
            "beautify": "Command-Shift-B"
        },
        "gotofile": {
            "gotofile": "Alt-Shift-R"
        },
        "newresource": {
            "newfile": "Option-Shift-N",
            "newfiletemplate": "Option-Ctrl-N",
            "newfolder": "Option-Ctrl-Shift-N"
        },
        "quicksearch": {
            "find": "Command-F",
            "findnext": "Command-G",
            "findprevious": "Command-Shift-G"
        },
        "searchreplace" : {
            "search": "Command-Shift-F",
            "searchreplace": "Command-Shift-R"
        },
        "searchinfiles" : {
            "searchinfiles": "Alt-Shift-F"
        },
        "formatjson" : {
            "format" : "Command-Shift-J"
        },
        "settings": {
            "showsettings": "Command-,"
        },
        "tabbehaviors" : {
            "closetab": "Option-W",
            "closealltabs": "Option-Shift-W",
            "closeallbutme": "Command-Option-W",
            "gototabright": "Command-]",
            "gototableft": "Command-[",
            "tab1": "Command-1",
            "tab2": "Command-2",
            "tab3": "Command-3",
            "tab4": "Command-4",
            "tab5": "Command-5",
            "tab6": "Command-6",
            "tab7": "Command-7",
            "tab8": "Command-8",
            "tab9": "Command-9",
            "tab0": "Command-0",
            "revealtab": "Command-Shift-L",
            "nexttab": "Command-Tab|Option-Tab",
            "previoustab": "Command-Shift-Tab|Option-Shift-Tab"
        },
        "tabsessions" : {
            "savetabsession": "Command-Alt-S"
        },
        "splitview" : {
            "mergetableft": "Command-Option-[",
            "mergetabright": "Command-Option-]"
        },
        "code" : {
            "selectall": "Command-A",
            "removeline": "Command-D",
            "togglecomment": "Command-/",
            "findnext": "Command-G",
            "findprevious": "Command-Shift-G",
            "find": "Command-F",
            "replace": "Command-Shift-R",
            "undo": "Command-Z",
            "redo": "Command-Shift-Z|Command-Y",
            "overwrite": "Insert",
            "copylinesup": "Command-Option-Up",
            "movelinesup": "Option-Up",
            "selecttostart": "Command-Shift-Up",
            "gotostart": "Command-Home|Command-Up",
            "selectup": "Shift-Up",
            "golineup": "Up",
            "copylinesdown": "Command-Option-Down",
            "movelinesdown": "Option-Down",
            "selecttoend": "Command-Shift-Down",
            "gotoend": "Command-End|Command-Down",
            "selectdown": "Shift-Down",
            "golinedown": "Down",
            "selectwordleft": "Option-Shift-Left",
            "gotowordleft": "Option-Left",
            "selecttolinestart": "Command-Shift-Left",
            "gotolinestart": "Command-Left|Home",
            "selectleft": "Shift-Left",
            "gotoleft": "Left",
            "selectwordright": "Option-Shift-Right",
            "gotowordright": "Option-Right",
            "selecttolineend": "Command-Shift-Right",
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
        },
        "language": {
            "complete": "Ctrl-Space|Alt-Space",
            "renameVar": "Command-Option-R"
        }
    }
});

});
