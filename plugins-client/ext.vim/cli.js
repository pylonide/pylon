/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi AT c9 DOT io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var filesystem = require("ext/filesystem/filesystem");
var gotofile = require("ext/gotofile/gotofile");
var editors = require("ext/editors/editors");
var save = require("ext/save/save");
var ide = require("core/ide");
var tabbehaviors = require("ext/tabbehaviors/tabbehaviors");
var Editor = require("ace/editor").Editor;
var lang = require("ace/lib/lang");
var commands = require("ext/commands/commands");

exports.searchStore = {
    current: "",
    options: {
        needle: "",
        backwards: false,
        wrap: true,
        caseSensitive: false,
        wholeWord: false,
        regExp: false
    }
};

var cliCmds = {};

cliCmds.ascii = {
    name: "ascii",
    description: "",
    exec: function(editor) {
        var onSelectionChange = lang.delayedCall(function(e) {
            var c = editor.getCursorPosition();
            var ch = editor.session.getLine(c.row)[c.column - 1] || "\n";
            var code = ch.charCodeAt(0);
            var msg = JSON.stringify(ch).slice(1,-1) + "=" + " ";
            var str = code.toString(16);
            str = [,"\\x0","\\x", "\\u0", "\\u"][str.length] + str;
            msg += str + " ";
            msg += "\\" + code.toString(8) + " ";
            msg += "&#" + code + ";";
            editor.cmdLine.setMessage(msg);
            clear.delay(2000);
        });

        var clear = lang.delayedCall(function(e) {
            editor.removeListener(editor.asciiMessageListener);
            editor.asciiMessageListener = null;
            editor.cmdLine.setMessage("");
        });

        if (editor.asciiMessageListener) {
            return clear.call();
        }
        editor.on("changeSelection", editor.asciiMessageListener = function() {
            onSelectionChange.schedule(200);
        });
        onSelectionChange.call();
    }
};

cliCmds.set = {
    name: "set",
    description: "set editor option",
    exec: function(editor, args) {
        var cmd = args.text.split(" ");
        var optName = cmd[1];
        var optValue = parseOption(cmd[2]);
        editor.setOption(optName, optValue);
    },
    getCompletions: function() {
        return Object.keys(Editor.prototype.$options);
    }
};

function parseOption(optValue) {
    if (/^\d+$/.test(optValue))
        optValue = parseInt(optValue, 10);
    if (/^[\d.\^e]+$/.test(optValue))
        optValue = parseFloat(optValue);
    else if (/^(true|false)$/i.test(optValue))
        optValue = optValue.length = 4;
    return optValue;
}

cliCmds["/"] = {
    name: "/",
    history:[],
    cliExec: function(ed, data) {
        var options = exports.searchStore.options;
        data = data || this.name;
        options.backwards = data[0] === "?";
        data = data.substr(1);
        if (data)
            exports.searchStore.current = data;
        else
            data = exports.searchStore.current;
        ed.find(data, options);
    }
};

cliCmds["?"] = {
    name: "?",
    history: cliCmds["/"].history,
    cliExec: cliCmds["/"].cliExec
};

cliCmds[":"] = {
    name: ":",
    history:[],
    getCompletions: function() {
        return Object.keys(this.commands).concat(Object.keys(commands.byName));
    }
};

cliCmds[":"].commands = {
    w: function(editor, data) {
        var page = ide.getActivePage();
        if (!page)
            return;

        var lines = editor.session.getLength();
        if (data.argv.length === 2) {
            var path = (ide.davPrefix + "/" + data.argv[1]).replace(/\/+/, "/");
            page.$model.data.setAttribute("path", path);

            save.saveas(page, function() {
                console.log(path + " [New] " + lines + "L, ##C written");
            });
        }
        else {
            save.quicksave(null, function() {
                console.log(page.name + " " + lines +"L, ##C written");
            });
        }
    },
    e: function(editor, data) {
        var path = data.argv[1];
        if (!path) {
            gotofile.toggleDialog(1);
            return false;
        }
        else {
            path = (ide.davPrefix + "/" + path).replace(/\/+/, "/");
            filesystem.exists(path, function(exists){
                if (exists) {
                    editors.gotoDocument({path: path});
                }
                else {
                    var node = filesystem.createFileNodeFromPath(path);
                    node.setAttribute("newfile", "1");
                    node.setAttribute("changed", "1");
                    node.setAttribute("cli", "1"); // blocks Save As dialog

                    var doc = ide.createDocument(node);
                    doc.cachedValue = "";

                    editors.gotoDocument({
                        doc: doc,
                        type: "newfile",
                        origin: "newfile"
                    });
                }
            });
        }
    },
    x: function(editor, data) {
        var page = ide.getActivePage();
        if (!page)
            return;
        if (page.$doc.getNode().getAttribute("changed"))
            cliCmds.w(editor, data);
        cliCmds.q();
    },
    wq: function(editor, data) {
        cliCmds.w(editor, data);
        cliCmds.q();
    },
    q: function(editor, data) {
        var page = ide.getActivePage();
        var corrected = ide.dispatchEvent("beforeclosetab", {
            page: page
        });
        if (corrected)
            page = corrected;
        if (data && data.force) {
            var at = page.$at;
            at.undo_ptr = at.$undostack[at.$undostack.length-1];
            page.$doc.getNode().removeAttribute("changed");
        }
        editors.close(page);
    },
    "q!": function() {
        cliCmds.q(null, {force: true});
    },
    tabn: "gototabright",
    tabp: "gototableft",
    tabfirst: function() {
        tabbehaviors.cycleTab("first");
    },
    tablast: function() {
        tabbehaviors.cycleTab("last");
    },
    tabnew: function(editor, data) {
        path = data.argv[1];
        if (!path) {
            commands.exec("newfile");
        } else {
           cliCmds[":"].commands.e(editor, data); 
        }
    },
    tabclose: "closetab",
    tabmove: function(editor, data) {
        // todo
    },
    ascii: cliCmds.ascii
};

// aliases
cliCmds[":"].commands.write = cliCmds[":"].commands.w;
cliCmds[":"].commands.tabNext = cliCmds[":"].commands.tabn;
cliCmds[":"].commands.tabPrevious = cliCmds[":"].commands.tabp;
cliCmds[":"].commands.tabc = cliCmds[":"].commands.tabclose;

cliCmds[":"].commands.set = {
    vimOpts: [
        "cursorline", "cul", "nocursorline", "nocul", //, "highlightActiveLine",
        "expandtab", "et", "noexpandtab", "noet", //"useSoftTabs",
        "number", "nu", "nonumber", "nonu" // "showGutter"
        // ["relativenumber", "rnu", "norelativenumber", "nornu"]
        // 'softtabstop' 'sts' number
        // 'tabstop' 'ts' number
    ],
    exec: function(ed, args) {
        var optName = args.argv[1];
        var optval = optName.slice(0, 2) != "no";
        if (optName[optName.length-1] == "!") {
            var toggle = true;
            optName = optName.slice(0, -1);
        }
        var i = this.vimOpts.indexOf(optName);
        if (i == -1) {
            ed.cmdLine.setTimedMessage("Unrecognised option '" + optName + "'.", 1500);
            return;
        } else if (i < 4) {
            optName = "highlightActiveLine";
        } else if (i < 8) {
            optName = "useSoftTabs";
        } else if (i < 12) {
            optName = "showGutter";
        }        
        if (toggle) 
            optval = !ed.getOption(optName);
        ed.setOption(optName, optval);
    },
    getCompletions: function(e) {
        return this.vimOpts; //.concat(Object.keys(Editor.prototype.$options));
    }
};

cliCmds[":"].commands.syntax = commands.byName.syntax;

cliCmds[":"].cliExec = function(ed, cmd, tokens) {
    var last = tokens[tokens.length - 1];
    if (last && last.type == "invisible")
        cmd += last.value;
    cmd = cmd.substr(1).trim();
    var args = cmd.split(/\s+/);
    cmd = args[0];

    if (this.commands[cmd]) {
        cmd = this.commands[cmd];
        if (typeof cmd == "string")
            return commands.exec(cmd, null, {argv: args});
        else if(typeof cmd == "function")
            return cmd(ed, {argv: args});
        else if(cmd.exec)
            return cmd.exec(ed, {argv: args});
    }
    else if (commands.byName[cmd]) {
        commands.exec(cmd, null, {argv: args});
    }
    else if (/^\d+$/.test(cmd)) {
        ed.gotoLine(cmd, 0, true);
    }
    else {
        ed.cmdLine.setTimedMessage("Vim command '" + cmd + "' not implemented.", 1500);
    }
};


var allCommands;
function getCompletions(command) {
    if (command) {
        if (command.getCompletions)
            return command.getCompletions() || [];
        if (command.commands)
            return Object.keys(command.commands);
        return [];
    }

    if (!allCommands) {
        allCommands = Object.keys(commands.byName).concat(Object.keys(cliCmds));
    }
    return allCommands;
}

function getCommand(name, root) {
    if (root && root.commands && root.commands[name])
        return root.commands[name];
    if (root)
        return root;
    return cliCmds[name] || commands.byName[name];
}

function getActiveEditor() {
    var amlEditor = editors.currentEditor.amlEditor;
    if (editors.currentEditor.path == "ext/code/code" && amlEditor)
        return amlEditor.$editor;
}


function processCommandParts(ed, tokens, text) {
    for (var i = 0; i < tokens.length; i++) {
        var tok = tokens[i];
        var cmd = tok.command;
        if (!cmd)
            continue;
        if (cmd.name !== tok.value) {
            var next = tokens[i + 1];
            if (!next || next.type !== "invisible")
                continue;
        }
        if (cmd.cliExec)
            return cmd.cliExec(ed, text, tokens);
        else if (cmd.exec)
            return cmd.exec(ed, {argv: text.split(/\s+/), text: text, tokens: tokens});
    }
}

function endCommandInput(cmdLine) {
    cmdLine.addToHistory();
    cmdLine.setValue("");
    getActiveEditor().focus();
}

exports.initCmdLine = function(cmdLine) {
    cmdLine.commands.bindKeys({
        "Shift-Return|Ctrl-Return|Alt-Return": function(cmdLine) { cmdLine.insert("\n"); },
        "Esc|Shift-Esc|Ctrl-[": function(cmdLine){
            endCommandInput(cmdLine);
        },
        "Return": function run(cmdLine) {
            var editor = cmdLine.editor || getActiveEditor();
            var tokens = cmdLine.session.getTokens(0);
            editor.cmdLine = cmdLine;
            processCommandParts(editor, tokens, cmdLine.getValue());
            endCommandInput(cmdLine);
        },
        "Tab": function tabNext(ed) { tabCycle(ed, 1); },
        "Shift-Tab": function tabPrevious(ed) { tabCycle(ed, -1); },
        "Right": function arrowCompleteRight(ed) {
            var session = ed.session;
            var col = ed.selection.isEmpty() ? ed.selection.lead.column : -1;
            ed.navigateRight();
            var tok = session.getTokenAt(0, col+1);
            if (col == ed.selection.lead.column && tok.type == "invisible")
                session.doc.insertInLine({row:0, column: col}, tok.value);
        },

        "Up": function(cmdLine) {cmdLine.navigateHistory(-1)},
        "Down": function(cmdLine) {cmdLine.navigateHistory(1)},
        "Ctrl-Home|PageUp": function(cmdLine) {cmdLine.navigateHistory(0)},
        "Ctrl-End|PageDown": function(cmdLine) {cmdLine.navigateHistory()}
    });

    function tabCycle(ed, dir) {
        var session = ed.session;
        var range = ed.getSelectionRange();
        var line = session.getLine(0);
        var len = line.length;
        if (range.end.column != len || !range.isEmpty()) {
            ed.navigateLineEnd();
            return;
        }

        if (!ed.$tabCycle) {
            var tok = session.getTokenAt(0, len) || {value: "", type: ""};
            var matches = session.getState(0);

            if (matches == "start")
                matches = getCompletions();
            if (!matches)
                return;

            if (matches.length == 1 && tok.value == matches[0]) {
                if (tok.command) {
                    matches = getCompletions(tok.command);
                    tok = {value: "", type: ""};
                }
                if (!matches)
                    return;
            }

            ed.$tabCycle = {
                matches: matches,
                index: tok.value == matches[0] ? 0 : -1,
                start: len - tok.value.length
            };
            ed.commands.on("exec", function onExec(e) {
                var name = e.command && e.command.name;
                if (name !== "tabNext" && name !== "tabPrevious") {
                    ed.$tabCycle = null;
                    ed.commands.removeListener("exec", onExec);
                }
            });
        }

        var matches = ed.$tabCycle.matches;
        var index = ed.$tabCycle.index;
        var start = ed.$tabCycle.start;

        index += dir;
        index %= matches.length;
        if (index < 0)
            index = matches.length + index;
        ed.$tabCycle.index = index;

        var match = matches[index];
        if (!match)
            return;

        var i = 0;
        while (match[i] && match[i] == line[start + i])
            i++;
        start += i;
        match = match.substr(i);

        if (i == 0 && (/\w/.test(match[0]) && /\w/.test(line[start - 1])))
            match = " " + match;
        if (/\w$/.test(match))
            match += " ";

        range.start.column = start;
        range.end.column = len;
        session.replace(range, match);

        if (ed.$tabCycle.matches.length == 1)
            ed.$tabCycle = null;
    }

    cmdLine.history = [];
    cmdLine.navigateHistory = function(dir) {
        var cliCmd = this.getCurrentCommandWithHistory() || {};
        var history = cliCmd.history || this.history;
        var index = history.index;
        var cmd = history[index] || "";

        if (dir == 0) {
            index = 0;
        } else if (dir == null) {
            index = history.length;
        } else if (typeof dir == "number") {
            index += dir;
            if (index < 0)
                index = 0;
            if (index > history.length)
                index = history.length;
        }

        cmd = history[index] || "";
        if (cliCmd.history && cliCmd.name)
            cmd = cliCmd.name + cmd;
        // TODO keep history.lastTyped
        this.setValue(cmd, 1);
        history.index = index;
    };

    cmdLine.addToHistory = function(val) {
        var cliCmd = this.getCurrentCommandWithHistory() || {};
        var history = cliCmd.history || this.history;
        val = val || this.getValue();
        if (cliCmd.name && cliCmd.history)
            val = val.substr(cliCmd.name.length);

        if (val && val != history[history.index]) {
            history.push(val);
            history.index = history.length;
        }
    };

    cmdLine.getCurrentCommand = function() {
        var tokens = this.session.getTokens(0);
        var tok = tokens[tokens.length - 1];
        return tok && tok.command;
    };

    cmdLine.getCurrentCommandWithHistory = function() {
        var tokens = this.session.getTokens(0);
        for (var i = tokens.length; i--; ) {
            var tok = tokens[i];
            if (tok && tok.command && tok.command.history)
                return tok.command;
        }
    };

    cmdLine.on("blur", function() {
        cmdLine.renderer.$cursorLayer.element.style.opacity = 0;
        if (!cmdLine.getValue()) {
            cmdLine.renderer.content.style.visibility = "hidden";
            cmdLine.$messageNode.style.display = "";
            cmdLine.$inMessageMode = true;
            cmdLine.$messageNode.textContent = cmdLine.$message || "";
        }
    });

    cmdLine.on("focus", function() {
        cmdLine.renderer.$cursorLayer.element.style.opacity = "";
        cmdLine.renderer.content.style.visibility = "";
        cmdLine.$messageNode.style.display = "none";
        cmdLine.$inMessageMode = false;
    });

    cmdLine.commands.on("exec", function(e) {
        if (!e.command)
            return;
        if (e.command.name == "insertstring") {

        }
        cmdLine.commands.lastCommandName = e.command.name;
    });

    cmdLine.session.bgTokenizer.$tokenizeRow = function(row) {
        var line = this.doc.getLine(row);
        var command = null;
        var tokens = [];
        function add(type, value) {
            tokens.push({type: type, value:value, command: command});
        }

        while (line.length) {
            var names = getCompletions(command);
            var matches = matchCommand(line, names);

            if (!matches.length) {
                add("text", line);
                break;
            }
            var cur = matches[0];
            command = getCommand(cur, command);
            if (cur.length >= line.length) {
                add("keyword", line);
                add("invisible", cur.substring(line.length));
            } else {
                add("keyword", cur);
            }
            line = line.substr(cur.length);
            var i = line.search(/\S|$/);
            if (i > 0) {
                add("text", line.substring(0, i));
                line = line.substr(i);
                if (!line.length)
                    matches = getCompletions(command);
            }
        }

        this.lines[row] = tokens;
        this.states[row] = matches;
        return tokens;
    };

    function matchCommand(line, names) {
        var matches = [];
        names.forEach(function(name) {
            if (name.length < line.length) {
                var isMatch = line.lastIndexOf(name, 0) === 0;
                if (isMatch && /\w/.test(name[name.length - 1]))
                    isMatch = !/\w/.test(line[name.length]);
            } else {
                var isMatch = name.lastIndexOf(line, 0) === 0;
            }
            if (isMatch)
                matches.push(name);
        });
        return matches;
    }

    cmdLine.$messageNode = document.createElement("div");
    cmdLine.$messageNode.style.cssText = "position:absolute;color:darkslateblue;padding:0 5px;top:0;font-size:11px";
    cmdLine.container.appendChild(cmdLine.$messageNode);
    
    cmdLine.$clearMessageDelayed = lang.delayedCall(function() {
        cmdLine.setMessage("");
    });
    cmdLine.setTimedMessage = function(text, timeout) {
        this.setMessage(text);
        this.once("setMessage", function() {
            cmdLine.$clearMessageDelayed.cancel();
        });
        cmdLine.$clearMessageDelayed.schedule(timeout || 2000);
    };

    cmdLine.setMessage = function(text, from) {
        this._signal("setMessage", text);
        this.$message = text;
        if (this.$inMessageMode)
            this.$messageNode.textContent = text;
    };

    if (!cmdLine.isFocused())
        cmdLine._emit("blur");

    cmdLine.commands.removeCommands(["find", "gotoline", "findall", "replace", "replaceall"]);
};

});
