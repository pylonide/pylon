/**
 * Console for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

"use strict";

var ext = require("core/ext");
var markup = require("text!ext/consolehints/consolehints.xml");
var css = require("text!ext/consolehints/consolehints.css");
var Console = require("ext/console/console");

var winHints, selectedHint, animControl, hintsTimer;

var KEY_TAB = 9;
var KEY_CR = 13;
var KEY_UP = 38;
var KEY_ESC = 27;
var KEY_DOWN = 40;
var actionCodes = [KEY_TAB, KEY_CR, KEY_UP, KEY_ESC, KEY_DOWN];

var filterCommands = function(commands, word) {
    return commands.filter(function(cmd) {
        return cmd.search("^" + word) !== -1;
    }).sort();
};

var mouseHandler = function(e) {
    clearTimeout(hintsTimer);
    var el = e.target || e.srcElement;
    while (el && el.nodeType === 3 && el.tagName != "A" && el != winHints) {
        el = el.parentNode;
    }
    if (el.tagName != "A")
        return;

    hintsTimer = setTimeout(function() {
        exports.select(el);
    }, 5);
};

var fontSize;
var getFontSize = function(txtNode) {
    if (fontSize)
        return fontSize;

    var font = apf.getStyle(txtNode, "font");
    var el = document.createElement("span");
    el.style.font = font;
    el.innerHTML = "W";
    document.body.appendChild(el);
    fontSize = {
        width: el.offsetWidth,
        height: el.offsetHeight
    };
    document.body.removeChild(el);
    return fontSize;
};

module.exports = ext.register("ext/consolehints/consolehints", {
    name   : "ConsoleHints",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    css    : css,
    deps   : [Console],
    hidden : true,
    nodes  : [],

    autoOpen : true,
    excludeParent : true,

    init: function() {
        apf.importCssString(this.css);
        winHints = document.getElementById("barConsoleHints");
        apf.addListener(winHints, "mousemove", mouseHandler.bind(this));

        Console.messages.commandhints = function(message) {
            var cmds = message.body;
            for (var cmd in cmds)
                console.commands[cmd] = cmds[cmd];
        };

        var self = this;
        txtConsoleInput.addEventListener("blur", function(e) {
            self.hide();
        });

        txtConsoleInput.addEventListener("keyup", function(e) {
            var cli = e.currentTarget.getValue();
            if (cli) {
                var keys = Object.keys(Console.allCommands);
                var filtered = filterCommands(keys, cli);
                if (filtered.length)
                    self.show(cli, "", filtered, 0);
                else
                    self.hide();
            }
            else {
                self.hide();
            }
        });
    },

    show: function(textbox, base, hints, cursorPos) {
        if (animControl && animControl.stop)
            animControl.stop();

        winHints.innerHTML = "";

        var cmdName, cmd;
        var linksFragment = document.createDocumentFragment();
        hints.forEach(function(hint) {
            cmdName = base ? base + hint.substr(1) : hint;
            cmd = Console.allCommands[cmdName];

            var link = document.createElement("a");
            var dataHint = [base, cmdName, textbox.id, cursorPos, !!cmd].join(",");
            link.setAttribute("data-hint", dataHint);
            link.innerHTML = cmdName;

            if (cmd) {
                var span = document.createElement("span");
                span.innerHTML = cmd.hint;

                if (cmd.hotkey) {
                    var spanHotkey = document.createElement("span");
                    spanHotkey.setAttribute("class", "hints_hotkey");
                    spanHotkey.innerHTML =
                        apf.isMac ? apf.hotkeys.toMacNotation(cmd.hotkey) : cmd.hotkey;

                    span.appendChild(spanHotkey);
                }
                link.appendChild(span);
            }
            linksFragment.appendChild(link);
        });
        winHints.appendChild(linksFragment);
        winHints.addEventListener("click", this.click.bind(this));

        selectedHint = null;

        if (apf.getStyle(winHints, "display") === "none") {
            winHints.style.display = "block";
            winHints.visible = true;
        }

        var size = getFontSize(textbox.$ext);
        winHints.style.left = Math.max(cursorPos * (size.width - 1.6) + 5, 5) + "px";
    },

    hide: function() {
        winHints.style.display = "none";
        winHints.visible = false;
        selectedHint = null;
    },

    click: function(e) {
        var node = e;
        var parts = node.getAttribute("data-hint").split(",");
        var base = parts[0];
        var cmdName = parts[1];
        var txtId = parts[2];
        var insertPoint = parseInt(parts[3], 10);
        var isCmd = (parts[4] === "true");

        if (isCmd)
            cmdName += " "; // for commands we suffix with whitespace

        var textbox = window[txtId];
        var input = textbox.$ext.getElementsByTagName("input")[0];
        var val = textbox.getValue();
        var before = val.substr(0, (insertPoint + 1 - base.length)) + cmdName;

        textbox.setValue(before + val.substr(insertPoint + 1));
        textbox.focus();
        // set cursor position at the end of the text just inserted:
        input.selectionStart = input.selectionEnd = before.length;
        this.hide();
    },

    selectUp: function() {
        var hintNodes = winHints.childNodes;
        var newHint = selectedHint - 1;

        if (newHint < 0)
            newHint = hintNodes.length - 1;

        this.select(newHint);
    },

    selectDown: function() {
        var hintNodes = winHints.childNodes;

        var newHint = selectedHint + 1;
        if (newHint > hintNodes.length)
            newHint = 0;

        return this.select(newHint);
    },

    select: function(hint) {
        clearTimeout(hintsTimer);
        var hintNodes = winHints.childNodes;

        if (typeof hint === "number")
            hint = hintNodes[hint];

        for (var i = 0, l = hintNodes.length; i < l; ++i) {
            if (hintNodes[i] === hint) {
                selectedHint = i;
                continue;
            }
            hintNodes[i].className = "";
        }

        if (hint)
            hint.className = "selected";
    },

    visible: function() {
        return winHints && !!winHints.visible;
    },

    selected: function() {
        return selectedHint && winHints.childNodes
            ? winHints.childNodes[selectedHint]
            : false;
    }
});
});
