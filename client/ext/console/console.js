/**
 * Console for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var panels = require("ext/panels/panels");
var editors = require("ext/editors/editors");
var Parser = require("ext/console/parser");
var Logger = require("ext/console/logger");
var Trie = require("ext/console/trie");
var Hints = require("ext/console/hints");
var css = require("text!ext/console/console.css");
var markup = require("text!ext/console/console.xml");
// Some hardcoded commands and their responses
var Output = require("ext/console/output");

var trieCommands;
var commands   = {};
var cmdTries   = {};
var cmdFetched = false;
var cmdBuffer  = "";
var lastSearch = null;
var parser = new Parser();

var KEY_TAB = 9;
var KEY_CR = 13;
var KEY_UP = 38;
var KEY_ESC = 27;
var KEY_DOWN = 40;
var actionCodes = [KEY_TAB, KEY_CR, KEY_UP, KEY_ESC, KEY_DOWN];

var cmdHistory = {
    _history: [],
    _index: 0,

    push: function(cmd) {
        this._history.push(cmd);
        this._index += 1;
    },
    length: function() {
        return this._history.length;
    },
    getNext: function() {
        this._index += 1;
        var cmd = this._history[this._index] || "";

        var maxLen = this._history.length - 1;
        if (this._index > maxLen)
            this._index = maxLen;

        return cmd;
    },
    getPrev: function() {
        this._index -= 1;
        if (this._index < 0)
            this._index = 0;

        return this._history[this._index];
    }
};

module.exports = ext.register("ext/console/console", {
    name   : "Console",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    css    : css,

    excludeParent : true,
    commands : {
        "help": {
            hint: "show general help information and a list of available commands"
        },
        "clear": {
            hint: "clear all the messages from the console"
        },
        "switchconsole": {
            hint: "toggle focus between the editor and the console"
        },
        "send": {
            hint: "send a message to the server"
        }
    },

    help : function() {
        var words = trieCommands.getWords();
        var tabs = "\t\t\t\t";

        Logger.logNodeStream(
            words
                .filter(function(w) { return commands[w]; })
                .map(function(w) { return w + tabs + commands[w].hint; })
                .join("\n")
        );
    },

    clear : function() {
        this.inited && txtOutput.clear();
    },

    switchconsole : function() {
        if (apf.activeElement == txtConsoleInput) {
            if (window.ceEditor) {
                ceEditor.focus();
                this.disable();
            }
        }
        else {
            txtConsoleInput.focus()
        }
    },

    send : function(data) {
        ide.send(data.line.replace(data.command,"").trim());
        return true;
    },

    showOutput : function(){
        tabConsole.set(1);
    },

    jump: function(path, row, column) {
        row = parseInt(row.slice(1), 10);
        column = column ? parseInt(column.slice(1), 10) : 0;
        editors.showFile(path, row, column);
    },

    getCwd: function() {
        return this.$cwd && this.$cwd.replace("/workspace", ide.workspaceDir);
    },

    write: function(aLines) {
        if (typeof aLines == "string")
            aLines = aLines.split("\n");

        aLines.forEach(function(line) { Logger.log(line, "log"); });

        Logger.log("", "divider");
    },

    keyupHandler: function(e) {
        if (actionCodes.indexOf(e.keyCode) === -1) {
            return this.commandTextHandler(e);
        }
    },

    keydownHandler: function(e) {
        if (actionCodes.indexOf(e.keyCode) !== -1) {
            return this.commandTextHandler(e);
        }
    },

    commandTextHandler: function(e) {
        var line = e.currentTarget.getValue();
        if (cmdBuffer === null || (cmdHistory._index === 0 && cmdBuffer !== line)) {
            cmdBuffer = line;
        }

        parser.parseLine(line);

        var code = e.keyCode;
        var hisLength = cmdHistory.length();
        var hintsVisible = Hints.visible();

        if (code === KEY_UP) { //UP
            if (hintsVisible) {
                Hints.selectUp();
            }
            else if (hisLength) {
                var newVal = cmdHistory.getPrev();

                if (newVal)
                    e.currentTarget.setValue(newVal);
            }
            return false;
        }
        else if (code === KEY_DOWN) { //DOWN
            if (hintsVisible) {
                Hints.selectDown();
            }
            else if (hisLength) {
                e.currentTarget.setValue(cmdHistory.getNext() || "");
            }
            return false;
        }
        else if (code === KEY_ESC && hintsVisible) {
            return Hints.hide();
        }
        else if (code != KEY_CR && code != KEY_TAB) {
            return this.autoComplete(e, parser, 2);
        }

        if (hintsVisible && Hints.selected())
            return Hints.click(Hints.selected());

        if (parser.argv.length === 0) {
            // no commmand line input
        }
        else if (parser.argQL[0]) {
            // first argument quoted -> error
            this.write("Syntax error: first argument quoted.");
        }
        else {
            if (code === KEY_TAB) {
                this.autoComplete(e, parser, 1);
                return false;
            }

            cmdHistory.push(line);
            cmdBuffer = null;
            e.currentTarget.setValue("");
            Hints.hide();

            Logger.log(this.getPrompt() + " " + parser.argv.join(" "), "prompt");
            this.enable();
            tabConsole.set("console");

            var cmd = parser.argv[0];

            // If there is a predefined (i.e. hardcoded) output for the current
            // command being executed in the CLI, show that.
            if (Output[cmd]) {
                var rest = parser.argv.join(" ").replace(new RegExp("^" + cmd), "").trim();
                var msg = Output[cmd][rest];

                if (Output[cmd][rest])
                    this.write(msg);
                else
                    this.write(Output[cmd].__default__.replace("%s", cmd));
            }
            else {
                if (cmd === "help") {
                    this.help();
                }
                else if (cmd === "clear") {
                    txtConsole.clear();
                }
                else {
                    var rest = parser.argv.join(" ").trim();
                    if (Output.general[rest]) {
                        this.write(Output.general[rest]);
                    }
                    else {
                        if (cmd.trim().charAt(0) == "!") {
                            var bandRE = /^\s*!/;
                            cmd = "bash";
                            parser.argv[0] = parser.argv[0].replace(bandRE, "");
                            line = line.replace(bandRE, "");
                        }

                        ide.dispatchEvent("track_action", {
                            type: "console",
                            cmd: cmd
                        });

                        var data = {
                            command: cmd,
                            argv: parser.argv,
                            line: line,
                            cwd: this.getCwd()
                        };

                        if (ext.execCommand(cmd, data) !== false) {
                            var evtName = "consolecommand." + cmd;
                            if (ide.dispatchEvent(evtName, { data: data }) !== false) {
                                if (!ide.onLine)
                                    this.write("Cannot execute command. You are currently offline.");
                                else
                                    ide.send(JSON.stringify(data));
                            }
                        }
                    }
                }
            }
        }
    },

    onMessage: function(e) {
        var res;
        var message = e.message;

        if (message.type == "node-data")
            return Logger.logNodeStream(message.data, message.stream, true);

        if (message.type != "result")
            return;

        switch (message.subtype) { 
            case "commandhints":
                var cmds = message.body;
                this.initCommands();
                for (var cmd in cmds) {
                    trieCommands.add(cmd);
                    commands[cmd] = cmds[cmd];
                    if (cmds[cmd].commands)
                        this.subCommands(cmds[cmd].commands, cmd);
                }
                cmdFetched = true;
                break;
            case "internal-autocomplete":
                res = message.body;
                var base = res.base || "";
                var blen = base.length;
                lastSearch = res;
                lastSearch.trie = new Trie();

                var m;
                for (var i = 0, l = res.matches.length; i < l; ++i) {
                    m = res.matches[i];
                    lastSearch.trie.add(m);
                    if (base && m.indexOf(base) === 0)
                        res.matches[i] = m.substr(blen - 1);
                }
                Hints.show(res.textbox, res.base || "", res.matches, null, res.cursor);
                break;
            case "cd":
                res = message.body;
                if (res.cwd) {
                    this.$cwd = res.cwd.replace(ide.workspaceDir, "/workspace");
                    this.write("Working directory changed.");
                }
                break;
            case "mkdir":
                res = message.body;
                ide.dispatchEvent("filecallback", {
                    type: "folder",
                    path: this.$cwd + "/" + res.argv[res.argv.length - 1]
                });
                break;
            case "rm":
                res = message.body;
                ide.dispatchEvent("filecallback");
                break;
            case "error":
                Logger.log(message.body);
                Logger.log("", "divider");
                break;
            default:
                res = message.body;
                if (res) {
                    if (res.out)
                        Logger.logNodeStream(res.out);
                    if (res.err)
                        Logger.logNodeStream(res.err);
                    if (res.code) // End of command
                        Logger.log("", "divider");
                }
                break;
        }

        ide.dispatchEvent("consoleresult." + message.subtype, {data: message.body});
    },

    setPrompt: function(cwd) {
        if (cwd)
            this.$cwd = cwd.replace(ide.workspaceDir, ide.davPrefix);

        return this.getPrompt();
    },

    getPrompt: function() {
        if (!this.username)
            this.username = (ide.workspaceId.match(/user\/(\w+)\//) || [,"guest"])[1];

        return "[" + this.username + "@cloud9]:" + this.$cwd + "$";
    },

    subCommands: function(cmds, prefix) {
        if (!cmdTries[prefix]) {
            cmdTries[prefix] = {
                trie: new Trie(),
                commands: cmds
            };
        }

        for (var cmd in cmds) {
            cmdTries[prefix].trie.add(cmd);
            if (cmds[cmd].commands)
                this.subCommands(cmds[cmd].commands, prefix + "-" + cmd);
        }
    },

    initCommands: function() {
        if (trieCommands)
            return;
        trieCommands = new Trie();
        apf.extend(commands, ext.commandsLut);
        for (var name in ext.commandsLut) {
            trieCommands.add(name);
            if (ext.commandsLut[name].commands)
                this.subCommands(ext.commandsLut[name].commands, name);
        }
    },

    autoComplete: function(e, parser, mode) {
        mode = mode || 2;
        if (mode === 1) {
            if (this.$busy) return;
            var _self = this;
            this.$busy = setTimeout(function(){clearTimeout(_self.$busy);_self.$busy = null;}, 100);
        }

        this.initCommands();

        // keycodes that invalidate the previous autocomplete:
        if (e.keyCode == 8 || e.keyCode == 46)
            lastSearch = null;

        var cmds = commands;
        var textbox = e.currentTarget;
        var val = textbox.getValue();
        var cursorPos = 0;

        if (!apf.hasMsRangeObject) {
            var input = textbox.$ext.getElementsByTagName("input")[0];
            cursorPos = input.selectionStart;
        }
        else {
            var range = document.selection.createRange();
            var r2    = range.duplicate();

            r2.expand("textedit");
            r2.setEndPoint("EndToStart", range);
            cursorPos = r2.text.length;
        }
        cursorPos -= 1;

        if (!cmdFetched) {
            // the 'commandhints' command retreives a list of available commands
            // from all the server plugins, to support git auto-completion, for
            // example.
            ide.send(JSON.stringify({
                command: "commandhints",
                argv: parser.argv,
                cwd: this.getCwd()
            }));
        }

        var base = parser.argv[0];
        if (typeof base != "string")
            return Hints.hide();

        // check for commands in first argument when there is only one argument
        // provided, or when the cursor on the first argument
        var root;
        var list = [];
        var len = parser.argv.length;
        if (len === 1 && cursorPos < base.length) {
            root = trieCommands.find(base);
            if (root)
                list = root.getWords();
        }
        else {
            var idx, needle, cmdTrie;
            var i = len - 1;

            for (; i >= 0; --i) {
                idx = val.indexOf(parser.argv[i]);
                if (idx === -1) //shouldn't happen, but yeah...
                    continue;

                if (cursorPos >= idx || cursorPos <= idx + parser.argv[i].length) {
                    needle = i;
                    break;
                }
            }
            if (typeof needle != "number")
                needle = 0;

            ++needle;
            while (needle >= 0 && !(cmdTrie = cmdTries[parser.argv.slice(0, needle).join("-")]))
                --needle

            if (cmdTrie) {
                base = parser.argv[needle];
                root = cmdTrie.trie.find(base);
                if (root) {
                    list = root.getWords();
                }
                else {
                    list = cmdTrie.trie.getWords();
                    // check for file/folder autocompletion:
                    if (list.length == 1 && list[0] == "[PATH]") {
                        //console.log("we have PATH, ", base, lastSearch);
                        if (base && lastSearch) {
                            list.splice(0, 1);
                            var newbase = base.split("/").pop();
                            if (!newbase) {
                                base = "";
                                list = lastSearch.trie.getWords();
                            }
                            else if (newbase.indexOf(lastSearch.base) > -1) {
                                // console.log("searching for ", newbase, base, "mode:", mode);
                                root = lastSearch.trie.find(newbase);
                                if (root) {
                                    // console.log("setting base ", base, "to", base, newbase);
                                    base = newbase;
                                    list = root.getWords();
                                }
                            }
                            if (!list.length) {
                                // we COULD do something special here...
                            }
                        }
                        else {
                            if (mode == 2)
                                list.splice(0, 1);
                            //base = "";
                        }
                        // adjust the argv array to match the current cursor position:
                        parser.argv = parser.argv.slice(0, needle);
                        parser.argv.push(base);
                        // else: autocompletion is sent to the backend
                        //console.log("directory found: ", base, list, "mode:", mode);
                    }
                    else {
                        base = "";
                    }
                }
                cmds = cmdTrie.commands;
                //console.log("list: ", list, base, parser.argv);
            }
        }

        if (list.length === 0)
            return Hints.hide();

        if (mode === 2) { // hints box
            Hints.show(textbox, base || "", list, cmds, cursorPos);
        }
        else if (mode === 1) { // TAB autocompletion
            var ins = base ? list[0].substr(1) : list[0];
            if (ins.indexOf("PATH]") != -1 && lastSearch && lastSearch.line == val && lastSearch.matches.length == 1)
                ins = lastSearch.matches[0].replace(lastSearch.base, "");
            if (ins.indexOf("PATH]") != -1) {
                ide.send(JSON.stringify({
                    command: "internal-autocomplete",
                    line   : val,
                    textbox: textbox.id,
                    cursor : cursorPos,
                    argv   : parser.argv,
                    cwd    : this.getCwd()
                }));
            }
            else {
                if (!!(cmds || commands)[base + ins])
                    ins += " "; // for commands we suffix with whitespace
                var newval = val.substr(0, cursorPos + 1) + ins + val.substr(cursorPos + 1);
                if (val != newval)
                    textbox.setValue(newval);
                lastSearch = null;
            }
            Hints.hide();
        }
    },

    /**** Init ****/

    hook : function(){
        panels.register(this);
        panels.initPanel(this);
    },

    init : function(amlNode){
        var _self = this
        this.panel = tabConsole;
        this.$cwd  = "/workspace";

        //Append the console window at the bottom below the tab
        mainRow.appendChild(winDbgConsole); //selectSingleNode("a:hbox[1]/a:vbox[2]").

        apf.importCssString((this.css || "") + " .console_date{display:inline}");

        stProcessRunning.addEventListener("activate", function() {
            _self.clear();
            _self.showOutput();
            _self.enable();
        });

        ide.addEventListener("socketMessage", this.onMessage.bind(this));
        ide.addEventListener("consoleresult.internal-isfile", function(e) {
            var data = e.data;
            var path = data.cwd.replace(ide.workspaceDir, ide.davPrefix);
            if (data.isfile)
                editors.showFile(path);
            else
                Logger.log("'" + path + "' is not a file.");
        });

        winDbgConsole.previousSibling.hide(); //que?

        function kdHandler(e){
            if (!e.ctrlKey && !e.metaKey && !e.altKey
              && !e.shiftKey && apf.isCharacter(e.keyCode))
                txtConsoleInput.focus()
        }

        txtOutput.addEventListener("keydown", kdHandler);
        txtConsole.addEventListener("keydown", kdHandler);
    },

    enable : function(fromParent){
        /*if (!this.panel)
            panels.initPanel(this);

        if (this.manual && fromParent)
            return;

        if (!fromParent)
            this.manual = true;*/

        this.mnuItem.check();
        tabConsole.show();

        if (winDbgConsole.height == 41)
            winDbgConsole.setAttribute("height", this.height || 200);
        winDbgConsole.previousSibling.show();

        apf.layout.forceResize();
        apf.setStyleClass(btnCollapseConsole.$ext, "btn_console_openOpen");

    },

    disable : function(fromParent){
        /*if (this.manual && fromParent || !this.inited)
            return;

        if (!fromParent)
            this.manual = true;*/

        this.mnuItem.uncheck();
        tabConsole.hide();

        if (winDbgConsole.height != 41)
            this.height = winDbgConsole.height;
        winDbgConsole.setAttribute("height", 41);
        winDbgConsole.previousSibling.hide();

        apf.layout.forceResize();
        apf.setStyleClass(btnCollapseConsole.$ext, '' , ['btn_console_openOpen']);
    },

    destroy : function(){
        winDbgConsole.destroy(true, true);
        panels.unregister(this);
    }
});

});
