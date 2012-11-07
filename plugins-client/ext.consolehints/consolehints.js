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
var util = require("core/util");
var markup = require("text!ext/consolehints/consolehints.xml");
var css = require("text!ext/consolehints/consolehints.css");
var c9console = require("ext/console/console");
var commands = require("ext/commands/commands");

var winHints, hintsContent, selectedHint, animControl, hintsTimer;
var RE_lastWord = /(\w+)$/;

/*global apf txtConsolePrompt txtConsoleInput
*/

var filterCommands = function(commands, word) {
    if (!word)
        return commands.sort();

    var lowWord = word.toLowerCase();
    var sortedData = [];

    function springyIndex(commandName) {
        var c = {name: commandName};
        var lowName = c.name.toLowerCase();
        var priority = 0;
        var lastI = 0;
        var ind1 = 0;
        if (c.name.indexOf(word) === 0) {
            c.priority = -2;
            sortedData.push(c);
            return; //exact match
        }
        for(var j = 0, ftLen = lowWord.length; j < ftLen; j++) {
            lastI = lowName.indexOf(lowWord[j],ind1);
            if (lastI === -1)
                break; //doesn't match
            priority += lastI - ind1;
            ind1 = lastI+1;
        }
        if (lastI != -1) {
            c.priority = priority;
            sortedData.push(c);
        }
    }

    var sortFields = ["priority", "name"];

    commands.forEach(springyIndex);
    sortedData.sort(function (a, b) {
        for (var i = 0; i < sortFields.length; i++) {
            var prop = sortFields[i];
            if (a[prop] < b[prop])
                return -1;
            if (a[prop] > b[prop])
                return 1;
        }
        return 0;
    });
    return sortedData.map(function(c) {return c.name;});
};

var mouseHandler = function(e) {
    clearTimeout(hintsTimer);
    var el = e.target || e.srcElement;
    while (el && el.nodeType === 3 && el.tagName !== "A" && el !== hintsContent)
        el = el.parentNode;

    if (el.tagName !== "A") return;

    var self = this;
    hintsTimer = setTimeout(function() { self.select(el); }, 5);
};

var hintLink = function(data) {
    var dataAttr = apf.escapeXML([data.base, data.cmdName, data.cursorPos, !!data.cmd].join(","));
    if (!data.cmd)
        return '<a href="#" data-hint="'+ dataAttr + '">' + apf.escapeXML(data.cmdName) + '</a>';

    var spanHotkey = "";
    var key = data.cmd.hotkey;
    if (!key && data.cmd.bindKey) {
        if (typeof data.cmd.bindKey == "string")
            key = data.cmd.bindKey;
        else
            key = data.cmd.bindKey[commands.platform];
    }
    if (key) {
        var notation = apf.isMac ? apf.hotkeys.toMacNotation(key) : key;
        spanHotkey = '<span class="hints_hotkey">' + notation + '</span>';
    }

    var cmdText = "";
    if (data.showHelperText)
        cmdText = '<span>' + apf.escapeXML(data.cmd.hint || '') + '</span>';
    cmdText += spanHotkey;
    return '<a href="#" data-hint="'+ dataAttr + '">' + apf.escapeXML(data.cmdName) + cmdText + '</a>';
};

module.exports = ext.register("ext/consolehints/consolehints", {
    name   : "ConsoleHints",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    css    : util.replaceStaticPrefix(css),
    deps   : [c9console],
    hidden : true,
    nodes  : [],
    autoOpen : true,
    lastCliValue : "",

    hook : function(){
        var _self = this;

        ide.addEventListener("init.ext/console/console", function(e){
            ext.initExtension(_self);

            var hideInput = e.ext.hideInput;
            e.ext.hideInput = function(){
                _self.hide();
                hideInput.apply(c9console, arguments);
            };
        });
    },

    init: function() {
        var _self = this;
        var initConsoleDeps = function() {
            apf.importCssString(_self.css);
            winHints = document.getElementById("barConsoleHints");
            hintsContent = document.getElementById("consoleHintsContent");
            apf.addListener(winHints, "mousemove", mouseHandler.bind(_self));
            apf.addListener(winHints, "click", _self.click.bind(_self));

            c9console.onMessageMethods.commandhints = function(message) {
                var cmds = message.body;
                for (var cmd in cmds)
                    commands.commands[cmd] = cmds[cmd];
            };
            c9console.onMessageMethods["internal-autocomplete"] = function(message) {
                var cmds = message.body;
                _self.show(txtConsoleInput, "", cmds.matches, txtConsoleInput.getValue().length - 1);
            };

            // Asynchronously retrieve commands that other plugins may have
            // registered, hence the (relatively) long timeout.
            setTimeout(function() {
                ide.send({
                    command: "commandhints",
                    cwd: c9console.getCwd()
                });
            }, 1000);

            txtConsoleInput.addEventListener("focus", function(e) {
                if (txtConsoleInput.getValue() == hintsContent.text && hintsContent.hasChildNodes()) {
                    winHints.style.display = "block";
                    winHints.visible = true;
                }
            });
            txtConsoleInput.addEventListener("blur", function(e) {
                _self.hide();
            });

            txtConsoleInput.ace.container.addEventListener("input", function(e) {
                var getCmdMatches = function(filtered) {
                    hintsContent.text = txtConsoleInput.getValue();
                    if (filtered.length && filtered[0] !== "[PATH]")
                        _self.show(txtConsoleInput, "", filtered, hintsContent.text.length - 1);
                    else {
                        hintsContent.innerHTML = "";
                        _self.hide();
                    }
                };

                var cliValue = txtConsoleInput.getValue();

                if (_self.lastCliValue === cliValue)
                    return;

                _self.lastCliValue = cliValue;

                if (cliValue)
                    _self.getCmdCompletion(cliValue, getCmdMatches);
                else
                    _self.hide();
            }, false);

            // Below we are overwriting the Console default key events in function of
            // whether the hints are being displayed or not.
            var redefinedKeys = {
                "up": "selectUp",
                "tab": "onTabKey",
                "down": "selectDown",
                "esc": "hide",
                "return": "onEnterKey"
            };

            txtConsoleInput.ace.keyBinding.addKeyboardHandler({
                handleKeyboard: function(data, hashId, keyString) {
                    if (hashId == -1 || !redefinedKeys[keyString] || winHints.style.display === "none")
                        return;

                    if (_self[redefinedKeys[keyString]].call(_self) !== false)
                        return {command: "null"};
                }
            });
        };

        if (c9console && c9console.onMessageMethods)
            initConsoleDeps();
        else
            ide.addEventListener("init.ext/console/console", initConsoleDeps);
    },

    show: function(textbox, base, hints, cursorPos) {
        if (txtConsolePrompt.visible)
            return;

        if (animControl && animControl.stop)
            animControl.stop();

        var showHelperText = true;
        if (txtConsoleInput.getValue().split(" ").length > 1)
            showHelperText = false;

        var content = hints.map(function(hint) {
            var cmdName = base ? base + hint.substr(1) : hint;
            return hintLink({
                base: base,
                cmdName: cmdName,
                cursorPos: cursorPos,
                cmd: commands.commands[cmdName],
                showHelperText: showHelperText
            });
        }).join("");

        hintsContent.innerHTML = content;
        selectedHint = -1;

        if (apf.getStyle(winHints, "display") === "none") {
            winHints.style.display = "block";
            winHints.visible = true;
        }

        winHints.style.left = parseInt(cursorPos + 5, 10) + "px";
    },
    hide: function() {
        winHints.style.display = "none";
        winHints.visible = false;
        selectedHint = -1;

        return true;
    },
    click: function(e) {
        e.preventDefault();

        var node = e.target;
        this.setSelection(node);
    },
    setSelection: function(node){
        if (node.parentNode != hintsContent && node != hintsContent)
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

        txtConsoleInput.setValue(cliValue.replace("/?", ""));
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
            var rootCmd = commands.commands[fullCmd[1]];
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
            (fn2 || fn1)(filterCommands(Object.keys(commands.commands), value));
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
                            cwd: c9console.getCwd()
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

        return true;
    },
    onEnterKey: function() {
        var handled = false;
        var hintNodes = hintsContent.childNodes;
        for (var i = 0, l = hintNodes.length; i < l; ++i) {
            if (hintNodes[i].className === "selected") {
                this.setSelection(hintNodes[i]);
                handled = true;
                break;
            }
        }
        if (! handled)
            this.hide();
        return handled;
    },
    selectUp: function() {
        var newHint = selectedHint - 1;
        if (newHint < 0)
            newHint = hintsContent.childNodes.length - 1;

        this.select(newHint);
        return true;
    },
    selectDown: function() {
        var newHint = selectedHint + 1;
        if (newHint >= hintsContent.childNodes.length)
            newHint = -1;

        this.select(newHint);
        return true;
    },
    select: function(hint) {
        clearTimeout(hintsTimer);
        var hintNodes = hintsContent.childNodes;

        if (typeof hint === "number")
            hint = hintNodes[hint];

        selectedHint = -1;
        for (var i = 0, l = hintNodes.length; i < l; ++i) {
            if (hintNodes[i] === hint) {
                selectedHint = i;
                continue;
            }
            hintNodes[i].className = "";
        }

        if (hint) {
            hint.className = "selected";
            var offset = hint.offsetTop + hint.offsetHeight - winHints.clientHeight;
            if (winHints.scrollTop > hint.offsetTop)
                winHints.scrollTop = hint.offsetTop;
            else if (offset > winHints.scrollTop)
                winHints.scrollTop = offset;
        }
    },
    visible: function() {
        return winHints && !!winHints.visible;
    },
    selected: function() {
        return (selectedHint || selectedHint >= 0) && hintsContent.childNodes.length > 0
            ? hintsContent.childNodes[selectedHint]
            : false;
    }
});
});
