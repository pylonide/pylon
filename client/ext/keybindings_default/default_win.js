/**
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/keybindings_default/default_win", ["core/ide", "ext/keybindings/keybindings"], function(ide, keys) {

return keys.onLoad({
    "ext" : {
        "save" : {
            "quicksave": "Ctrl-S",
            "saveas": "Ctrl-Shift-S"
        },
        "undo" : {
            "undo": "Ctrl-Z",
            "redo": "Ctrl-Y"
        },
        "clipboard" : {
            "cut": "Shift-Ctrl-X",
            "copy": "Ctrl-C",
            "paste": "Ctrl-V"
        },
        "newresource": {
            "newfile": "Ctrl-N",
            "newfolder": "Ctrl-Shift-N"
        },
        "searchreplace" : {
            "search": "Ctrl-F",
            "searchreplace": "Ctrl-R"
        },
        "code" : {
            "selectall": "Ctrl-A",
            "removeline": "Ctrl-D",
            "gotoline": "Ctrl-L",
            "togglecomment": "Ctrl-7",
            "findnext": "Ctrl-K",
            "findprevious": "Ctrl-Shift-K",
            "find": "Ctrl-F",
            "replace": "Ctrl-R",
            "undo": "Ctrl-Z",
            "redo": "Ctrl-Shift=Z|Ctrl-Y",
            "overwrite": "Insert",
            "copylinesup": "Ctrl-Alt-Up",
            "movelinesup": "Alt-Up",
            "selecttostart": "Ctrl-Shift-Up",
            "gotostart": "Ctrl-Home|Ctrl-Up",
            "selectup": "Shift-Up",
            "golineup": "Up",
            "copylinesdown": "Ctrl-Alt-Down",
            "movelinsedown": "Alt-Down",
            "selecttoend": "Ctrl-Shift-Down",
            "gotoend": "Ctrl-End|Ctrl-Down",
            "selectdown": "Shift-Down",
            "godown": "Down",
            "selectwordleft": "Alt-Shift-Left",
            "gotowordleft": "Alt-Left",
            "selecttolinestart": "Ctrl-Shift-Left",
            "gotolinestart": "Ctrl-Left|Home",
            "selectleft": "Shift-Left",
            "gotoleft": "Left",
            "selectwordright": "Alt-Shift-Right",
            "gotowordright": "Alt-Right",
            "selecttolineend": "Ctrl-Shift-Right",
            "gotolineend": "Ctrl-Right|End",
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