/**
 * Console hints and autcompletion for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 * @contributor Sergi Mansilla <sergi AT c9 DOT io>
 */

define(function(require, exports, module) {

"use strict";

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/consolehints/consolehints.xml");
var css = require("text!ext/consolehints/consolehints.css");
var Console = require("ext/console/console");

var winHints, selectedHint, animControl, hintsTimer;
var RE_lastWord = /(\w+)$/;
var filterCommands = function(commands, word) {
    return commands.filter(function(cmd) {
        return cmd !== word && cmd.search("^" + word) !== -1;
    }).sort();
};

var mouseHandler = function(e) {
    clearTimeout(hintsTimer);
    var el = e.target || e.srcElement;
    while (el && el.nodeType === 3 && el.tagName !== "A" && el !== winHints)
        el = el.parentNode;

    if (el.tagName !== "A") return;

    var self = this;
    hintsTimer = setTimeout(function() { self.select(el); }, 5);
};

var fontSize;
// This function is not accurate, but we don't care since we don't need precision.
var getFontSize = function(txtNode) {
    if (fontSize)
        return fontSize;

    var font = apf.getStyle(txtNode, "font");
    var el = document.createElement("span");
    el.style.font = font;
    el.innerHTML = "m";
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
                Console.allCommands[cmd] = cmds[cmd];
        };

        var _self = this;
        Console.messages["internal-autocomplete"] = function(message) {
            var cmds = message.body;
            console.log(cmds)
            _self.show(txtConsoleInput, "", cmds.matches, txtConsoleInput.getValue().length - 1);
        };

        // Asynchronously retrieve commands that other plugins may have
        // registered, hence the (relatively) long timeout.
        setTimeout(function() {
            ide.send(JSON.stringify({
                command: "commandhints",
                cwd: Console.getCwd()
            }));
        }, 1000);

        var self = this;
        txtConsoleInput.addEventListener("blur", function(e) { self.hide(); });
        txtConsoleInput.addEventListener("keyup", function(e) {
            // Ignore up/down cursor arrows here
            if (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 9) return;
            var getCmdMatches = function(filtered) {
                var cli = e.currentTarget;
                if (filtered.length && filtered[0] !== "[PATH]")
                    self.show(cli, "", filtered, cli.getValue().length - 1);
                else {
                    self.hide();
                }
            };

            var cliValue = e.currentTarget.getValue();
            if (cliValue)
                self.getCmdCompletion(cliValue, getCmdMatches);
            else
                self.hide();
        });

        // Below we are overwriting the Console default key events in function of
        // whether the hints are being displayed or not.
        var redefinedKeys = {
            38: "selectUp",
            40: "selectDown",
            27: "hide",
            13: "onEnterKey",
            9: "onTabKey"
        };

        Object.keys(redefinedKeys).forEach(function(keyCode) {
            var previousKey = Console.keyEvents[keyCode];
            Console.keyEvents[keyCode] = function(target) {
                if (winHints.style.display === "none" && previousKey)
                    previousKey(target);
                else
                    self[redefinedKeys[keyCode]].call(self);
            };
        });
    },
    show: function(textbox, base, hints, cursorPos) {
        if (animControl && animControl.stop)
            animControl.stop();

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
        winHints.style.left = parseInt(cursorPos * size.width, 10) + "px";
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
        var cmdName = parts[1];
        var isCmd = (parts[3] === "true");

        if (isCmd)
            cmdName += " "; // for commands we suffix with whitespace

        var cliValue = txtConsoleInput.getValue();
        var index = cliValue.search(RE_lastWord);
        if (index !== -1) // If the command is partially there or not
            cliValue = cliValue.replace(RE_lastWord, cmdName);
        else
            cliValue += cmdName;

        txtConsoleInput.setValue(cliValue);
        txtConsoleInput.focus();

        var input = txtConsoleInput.querySelector("input");
        if (input)
            input.selectionStart = input.selectionEnd = index + cmdName.length;

        this.hide();
    },
    // Given a value and a function for subCommands `fn1` and a function for one
    // command `fn2`, calls the functions with the proper array of completions,
    // if any.
    getCmdCompletion: function(value, fn1, fn2) {
        var fullCmd = value.match(/(\w+)\s+(.*)$/);
        if (fullCmd) {
            // If we don't recognize the root command
            var rootCmd = Console.allCommands[fullCmd[1]];
            if (!rootCmd)
                return fn1([]);

            var subCommands = rootCmd.commands;
            var filtered;
            if (subCommands && subCommands["[PATH]"])
                filtered = ["[PATH]"];
            else if (subCommands)
                filtered = filterCommands(Object.keys(subCommands), fullCmd[2]);
            else
                filtered = [];

            fn1(filtered, fullCmd[1], fullCmd[2]);
        }
        else {
            (fn2 || fn1)(filterCommands(Object.keys(Console.allCommands), value));
        }
    },
    onTabKey: function() {
        this.hide();

        var cliValue = txtConsoleInput.getValue();
        if (!cliValue) return;

        this.getCmdCompletion(cliValue,
            function(cmds, cmd1, cmd2) {
                if (cmds.length) {
                    // This is legacy. Not the best way to determine if a command
                    // accepts filename inputs
                    if (cmds[0] === "[PATH]") {
                        ide.send({
                            command: "internal-autocomplete",
                            argv: [cmd1, cmd2],
                            cwd: Console.getCwd()
                        });
                    }
                    else {
                        cliValue = cliValue.replace(RE_lastWord, cmds[0]);
                    }
                }
            },
            function(cmds) {
                if (cmds.length) cliValue = cmds[0];
            }
        );

        txtConsoleInput.setValue(cliValue);
        // In order to avoid default blurring behavior for TAB
        setTimeout(function() { txtConsoleInput.focus(); }, 50);
    },
    onEnterKey: function() {
        var hintNodes = winHints.childNodes;
        for (var i = 0, l = hintNodes.length; i < l; ++i) {
            if (hintNodes[i].className === "selected") {
                this.click({ target: hintNodes[i] });
                break;
            }
        }
    },
    selectUp: function() {
        var newHint = selectedHint - 1;
        if (newHint < 0)
            newHint = winHints.childNodes.length - 1;

        this.select(newHint);
    },
    selectDown: function() {
        var newHint = selectedHint + 1;
        if (newHint > winHints.childNodes.length)
            newHint = 0;

        this.select(newHint);
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

        hint && (hint.className = "selected");
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
