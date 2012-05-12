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
var c9console = require("ext/console/console");
var commands = require("ext/commands/commands");

var winHints, hintsContent, selectedHint, animControl, hintsTimer;
var RE_lastWord = /(\w+)$/;
var filterCommands = function(commands, word) {
    return commands.filter(function(cmd) {
        return cmd.search(new RegExp("^" + word)) !== -1;
    }).sort();
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
    var dataAttr = [data.base, data.cmdName, data.cursorPos, !!data.cmd].join(",");
    if (!data.cmd)
        return '<a href="#" data-hint="'+ dataAttr + '">' + data.cmdName + '</a>';

    var spanHotkey = "";
    var key = data.cmd.hotkey;
    if (key) {
        var notation = apf.isMac ? apf.hotkeys.toMacNotation(key) : key;
        spanHotkey = '<span class="hints_hotkey">' + notation + '</span>';
    }

    var cmdText = "";
    if (data.showHelperText)
        cmdText = '<span>' + data.cmd.hint + '</span>';
    cmdText += spanHotkey;
    return '<a href="#" data-hint="'+ dataAttr + '">' + data.cmdName + cmdText + '</a>';
};

module.exports = ext.register("ext/consolehints/consolehints", {
    name   : "ConsoleHints",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    css    : css,
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
            }
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
            
            apf.addListener(document, "click", function(e){
                var node = e.target;
                if (node.parentNode.parentNode === txtConsoleInput.$ext)
                    return;
                if (node.parentNode != hintsContent || node != hintsContent)
                    _self.hide();
            });
            
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
                if (txtConsoleInput.getValue().length) {
                    winHints.style.display = "block";
                    winHints.visible = true;
                }
            });

            txtConsoleInput.addEventListener("keyup", function(e) {
                // Ignore up/down cursor arrows, enter, here
                if (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 9 || e.keyCode === 13) 
                    return;
                var getCmdMatches = function(filtered) {
                    if (filtered.length && filtered[0] !== "[PATH]")
                        _self.show(txtConsoleInput, "", filtered, txtConsoleInput.getValue().length - 1);
                    else {
                        _self.hide();
                    }
                };

                // dismiss on escape, else cliValue executes below
                if (e.keyCode === 27) {
                    _self.hide();
                    return;
                }

                var cliValue = e.currentTarget.getValue();

                if (_self.lastCliValue === cliValue)
                    return;

                _self.lastCliValue = cliValue;

                if (cliValue)
                    _self.getCmdCompletion(cliValue, getCmdMatches);
                else
                    _self.hide();

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
                var previousKey = c9console.keyEvents[keyCode];
                c9console.keyEvents[keyCode] = function(target) {
                    if (winHints.style.display === "none" && previousKey) {
                        previousKey(target);
                    }
                    else {
                        // try executing the redefined mapping
                        // if it returns false, then execute the old func
                        if (!_self[redefinedKeys[keyCode]].call(_self)) {
                            previousKey && previousKey(target);
                            _self.hide();
                        }
                    }
                };
            });
        };
        
        if (c9console && c9console.onMessageMethods) {
            initConsoleDeps();
        }
        else {
            ide.addEventListener("init.ext/console/console", initConsoleDeps);
        }
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
        selectedHint = null;

        if (apf.getStyle(winHints, "display") === "none") {
            winHints.style.display = "block";
            winHints.visible = true;
        }

        winHints.style.left = parseInt(cursorPos + 5, 10) + "px";
    },
    hide: function() {
        winHints.style.display = "none";
        winHints.visible = false;
        selectedHint = null;

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
        if (newHint > hintsContent.childNodes.length)
            newHint = 0;

        this.select(newHint);
        return true;
    },
    select: function(hint) {
        clearTimeout(hintsTimer);
        var hintNodes = hintsContent.childNodes;

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
        return (selectedHint || selectedHint >= 0) && hintsContent.childNodes.length > 0
            ? hintsContent.childNodes[selectedHint]
            : false;
    }
});
});
