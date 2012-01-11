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
var filterCommands = function(commands, word) {
    return commands.filter(function(cmd) {
        return cmd.search("^" + word) !== -1;
    }).sort();
};

var mouseHandler = function(e) {
    clearTimeout(hintsTimer);
    var el = e.target || e.srcElement;
    while (el && el.nodeType === 3 && el.tagName != "A" && el != winHints)
        el = el.parentNode;
        
    if (el.tagName != "A")
        return;

    var self = this;
    hintsTimer = setTimeout(function() { self.select(el); }, 5);
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

var hintLink = function(data) {
    var dataAttr = [data.base, data.cmdName, data.cursorPos, !!data.cmd].join(",");
    if (!data.cmd)
        return '<a href="#" data-hint="'+ dataAttr + '">' + data.cmdName + '</a>';

    var spanHotkey = "";
    var key = data.cmd.hotkey;
    if (key) {
        var notation = apf.isMac ? apf.hotkeys.toMacNotation(key) : key;
        spanHotkey = '<span class="hints_hotkey">' + notation + '</span>';
    }
    var cmdText = '<span>' + data.cmd.hint + '</span>' + spanHotkey;

    return '<a href="#" data-hint="'+ dataAttr + '">' + data.cmdName + cmdText + '</a>';
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
        apf.addListener(winHints, "click", this.click.bind(this));

        Console.messages.commandhints = function(message) {
            var cmds = message.body;
            for (var cmd in cmds)
                console.commands[cmd] = cmds[cmd];
        };

        var self = this;
        txtConsoleInput.addEventListener("blur", function(e) {
            //self.hide();
        });

        txtConsoleInput.addEventListener("keyup", function(e) {
            var cli = e.currentTarget;
            var cliValue = e.currentTarget.getValue();
            if (cliValue) {
                var keys = Object.keys(Console.allCommands);
                var filtered = filterCommands(keys, cliValue);
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

        var content = hints.map(function(hint) {
            var cmdName = base ? base + hint.substr(1) : hint;
            return hintLink({
                base: base,
                cmdName: cmdName,
                cursorPos: cursorPos,
                cmd: Console.allCommands[cmdName]
            });
        }).join("");

        winHints.innerHTML = content;
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
        var node = e.target;
        if (node.parentNode != winHints && node != winHints)
            node = node.parentNode;

        var parts = node.getAttribute("data-hint").split(",");
        var base = parts[0];
        var cmdName = parts[1];
        var insertPoint = parseInt(parts[2], 10);
        var isCmd = (parts[3] === "true");

        if (isCmd)
            cmdName += " "; // for commands we suffix with whitespace

        var input = txtConsoleInput.$ext.getElementsByTagName("input")[0];
        var val = txtConsoleInput.getValue();
        var before = val.substr(0, (insertPoint + 1 - base.length)) + cmdName;

        txtConsoleInput.setValue(before + val.substr(insertPoint + 1));
        txtConsoleInput.focus();
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
