/**
 * Console for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("core/settings");
var editors = require("ext/editors/editors");
var parseLine = require("ext/console/parser");
var Logger = require("ext/console/logger");
var css = require("text!ext/console/console.css");
var markup = require("text!ext/console/console.xml");

// Some constants used throughout the plugin
var commands = {};
var CWD = "/workspace";
var bandRE = /^\s*!/;
var KEY_TAB = 9;
var KEY_CR = 13;
var KEY_UP = 38;
var KEY_ESC = 27;
var KEY_DOWN = 40;
var actionCodes = [KEY_TAB, KEY_CR, KEY_UP, KEY_ESC, KEY_DOWN];

// Executes a command (presumably coming from the CLI).
var execAction = function(cmd, data) {
    ide.dispatchEvent("track_action", {
        type: "console",
        cmd: cmd,
        argv: data.argv
    });

    if (ext.execCommand(cmd, data) !== false) {
        var cmdEvt = "consolecommand." + cmd;
        var consoleEvt = "consolecommand";

        if (ide.dispatchEvent(cmdEvt, { data: data }) !== false &&
            ide.dispatchEvent(consoleEvt, { data: data }) !== false) {

            if (!ide.onLine)
                this.write("Cannot execute command. You are currently offline.");
            else
                ide.send(JSON.stringify(data));
        }
        else {
            // If any of the `consolecommand` events returns false, it means
            // that we don't want the console to show up.
            return false;
        }
    }
    return true;
};

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
    },
    getFromKey: function(keyCode) {
        if (this.length()) {
            var newVal;
            if (keyCode === KEY_UP)
                newVal = this.getPrev();
            else if (keyCode === KEY_DOWN)
                newVal = this.getNext();

            if (newVal)
                return newVal;
        }
    }
};

module.exports = ext.register("ext/console/console", {
    name   : "Console",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    css    : css,
    height : 200,
    hidden : true,
    nodes : [],

    autoOpen : true,
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

    messages: {
        cd: function(message) {
            var res = message.body;
            if (res.cwd) {
                this.$cwd = res.cwd.replace(ide.workspaceDir, "/workspace");
                this.write("Working directory changed.");
            }
        },
        /*
        mkdir: function(message) {
            res = message.body;
        }
        rm: function(message) {
            res = message.body;
        },
        */
        error: function(message) {
            Logger.log(message.body);
            Logger.log("", "divider");
        },
        __default__: function(message) {
            var res = message.body;
            if (res) {
                if (res.out)
                    Logger.logNodeStream(res.out);
                if (res.err)
                    Logger.logNodeStream(res.err);
                if (res.code) // End of command
                    Logger.log("", "divider");
            }
        }
    },

    help: function() {
        var words = Object.keys(commands);
        var tabs = "\t\t\t\t";

        Logger.logNodeStream(
            words
                .map(function(w) { return w + tabs + commands[w].hint; })
                .join("\n")
        );
    },

    clear: function() {
        txtOutput && txtOutput.clear();
    },

    switchconsole : function() {
        if (apf.activeElement === txtConsoleInput) {
            if (window.ceEditor) {
                ceEditor.focus();
                this.hide();
            }
        }
        else {
            txtConsoleInput.focus()
        }
    },

    send: function(data) {
        ide.send(data.line.replace(data.command,"").trim());
        return true;
    },

    showOutput: function(){
        tabConsole.set(1);
    },

    getCwd: function() {
        return this.$cwd && this.$cwd.replace("/workspace", ide.workspaceDir);
    },

    write: function(lines) {
        if (typeof lines === "string")
            lines = lines.split("\n");

        lines.forEach(function(line) { Logger.log(line, "log"); });
        Logger.log("", "divider");
    },

    keyupHandler: function(e) {
        if (actionCodes.indexOf(e.keyCode) === -1)
            return this.commandTextHandler(e);
    },

    keydownHandler: function(e) {
        if (actionCodes.indexOf(e.keyCode) !== -1)
            return this.commandTextHandler(e);
    },

    evalCmd: function(line) {
        var argv = parseLine(line);
        if (argv.length === 0) // no commmand line input
            return;

        // Replace any quotes in the command
        argv[0] = argv[0].replace(/["'`]/g, "");
        cmdHistory.push(line);
        Logger.log(this.getPrompt() + " " + line, "prompt");
        tabConsole.set("console");

        var showConsole = true;
        var cmd = argv[0];
        // `showConsole` is true if we want to expand the console after
        // executing a command.
        var predefined = require("ext/console/output").getPredefinedOutput(argv);
        if (predefined !== "") {
            this.write(predefined);
        }
        else {
            if (cmd.trim().charAt(0) === "!") {
                cmd = "bash";
                argv[0] = argv[0].replace(bandRE, "");
                line = line.replace(bandRE, "");
            }

            showConsole = execAction(cmd, {
                command: cmd,
                argv: argv,
                line: line,
                cwd: this.getCwd()
            });
        }
        if (showConsole)
            this.show();
    },

    commandTextHandler: function(e) {
        var cli = e.currentTarget;
        var code = e.keyCode;
        if (code === KEY_UP || code === KEY_DOWN) {
            var newVal = cmdHistory.getFromKey(code);
            if (newVal)
                cli.setValue(newVal);

            return;
        }
        else if (code !== KEY_CR) {
            return;
        }

        this.evalCmd(cli.getValue());
        cli.setValue("");
    },

    onMessage: function(e) {
        var message = e.message;

        if (message.type === "node-data")
            return Logger.logNodeStream(message.data, message.stream, true);

        if (message.type !== "result")
            return;

        var msgFn = this.messages[message.subtype];
        if (msgFn)
            msgFn.call(this, message);
        else
            this.messages.__default__.call(this, message);

        ide.dispatchEvent("consoleresult." + message.subtype, { data: message.body });
    },

    getPrompt: function() {
        var u = this.username;
        if (!u)
            u = (ide.workspaceId.match(/user\/(\w+)\//) || [,"guest"])[1];

        return "[" + u + "@cloud9]:" + this.$cwd + "$";
    },

    /**** Init ****/

    init : function(amlNode){
        var _self = this;

        this.panel = tabConsole;
        this.$cwd  = "/workspace"; // code smell

        // Append the console window at the bottom below the tab
        mainRow.appendChild(winDbgConsole);

        apf.importCssString(this.css);

        stProcessRunning.addEventListener("activate", function() {
            _self.clear();
            _self.showOutput();

            var autoshow = settings.model.queryValue("auto/console/@autoshow");
            if (_self.autoOpen && apf.isTrue(autoshow)) {
                _self.show();
            }
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

        txtConsoleInput.addEventListener("keyup", function(e) {
            _self.keyupHandler(e);
        });

        txtConsoleInput.addEventListener("keydown", function(e) {
            _self.keydownHandler(e);
        });

        function kdHandler(e){
            if (!e.ctrlKey && !e.metaKey && !e.altKey
              && !e.shiftKey && apf.isCharacter(e.keyCode))
                txtConsoleInput.focus();
        }

        tabConsole.addEventListener("afterrender", function() {
            txtOutput.addEventListener("keydown", kdHandler);
            txtConsole.addEventListener("keydown", kdHandler);

            var activePage = settings.model.queryValue("auto/console/@active");
            if (activePage && !this.getPage(activePage))
                activePage = null;

            if (!activePage)
                activePage = this.getPages()[0].name;

            this.set(activePage);
        });

        tabConsole.addEventListener("afterswitch", function(e){
            settings.model.setQueryValue("auto/console/@active", e.nextPage.name)
        });

        winDbgConsole.previousSibling.addEventListener("dragdrop", function(e){
            settings.model.setQueryValue("auto/console/@height",
                _self.height = winDbgConsole.height)
        });

        this.nodes.push(
            winDbgConsole,

            mnuWindows.appendChild(new apf.item({
                id: "chkConsoleExpanded",
                caption: "Console",
                type: "check",
                "onprop.checked" : function(e) {
                    if (e.value)
                        _self.show();
                    else
                        _self.hide();
                }
            }))
        );

        ide.addEventListener("loadsettings", function(e){
            if (!e.model.queryNode("auto/console/@autoshow"))
                e.model.setQueryValue("auto/console/@autoshow", true);

            _self.height = e.model.queryValue("auto/console/@height") || _self.height;

            if (apf.isTrue(e.model.queryValue("auto/console/@maximized"))) {
                _self.show(true);
                _self.maximize();
            }
            else {
                if (apf.isTrue(e.model.queryValue("auto/console/@expanded")))
                    _self.show(true);
                else
                    _self.hide(true);
            }
        });

        apf.extend(commands, ext.commandsLut);
        /*
        for (var name in ext.commandsLut) {
            if (ext.commandsLut[name].commands)
                commands[name].commands = ext.commandsLut[name].commands;
        }
        */
    },

    maximize : function(){
        if (this.maximized)
            return;
        this.maximized = true;

        apf.document.body.appendChild(winDbgConsole);
        winDbgConsole.setAttribute('anchors', '0 0 0 0');
        //this.lastHeight = winDbgConsole.height;
        this.lastZIndex = winDbgConsole.$ext.style.zIndex;
        winDbgConsole.removeAttribute('height');
        winDbgConsole.$ext.style.zIndex = 900000;

        settings.model.setQueryValue("auto/console/@maximized", true);
        btnConsoleMax.setValue(true);
    },

    restore : function(){
        if (!this.maximized)
            return;

        this.maximized = false;

        mainRow.appendChild(winDbgConsole);
        winDbgConsole.removeAttribute('anchors');
        winDbgConsole.setAttribute('height', this.height);
        winDbgConsole.$ext.style.zIndex = this.lastZIndex;

        settings.model.setQueryValue("auto/console/@maximized", false);
        btnConsoleMax.setValue(false);
    },

    show: function(immediate) {
        this._show(true, immediate);
    },

    hide: function(immediate) {
        this._show(false, immediate);
    },

    _show: function(shouldShow, immediate) {
        if (this.hidden != shouldShow)
            return;

        this.hidden = !shouldShow;

        if (this.$control)
            this.$control.stop();

        if (shouldShow) {
            tabConsole.show();
            apf.setStyleClass(btnCollapseConsole.$ext, "btn_console_openOpen");
        }
        else {
            if (winDbgConsole.parentNode != mainRow)
                this.restore();

            apf.setStyleClass(btnCollapseConsole.$ext, "", ["btn_console_openOpen"]);
        }

        var finish = function(height) {
            winDbgConsole.height = height;
            winDbgConsole.setAttribute("height", height);
            winDbgConsole.previousSibling[shouldShow ? "show" : "hide"]();

            apf.layout.forceResize();

            settings.model.setQueryValue("auto/console/@expanded", shouldShow);
            chkConsoleExpanded[shouldShow ? "check" : "uncheck"]();
        };

        if (!immediate && apf.isTrue(settings.model.queryValue("general/@animateui"))) {
            var from = shouldShow ? 65 : this.height;
            var to = shouldShow ? this.height : 65;

            apf.tween.single(winDbgConsole.$ext, {
                control : this.$control = {},
                type  : "height",
                anim  : apf.tween[shouldShow ? "easeOutQuint" : "easeInOutCubic"],
                from  : from,
                to    : to,
                steps : 8,
                interval : 5,
                onfinish : finish,
                oneach : apf.layout.forceResize()
            });
        }
        else {
            finish();
        }

    },
    enable : function() {
        this.nodes.each(function(item){
            item.enable();
        });
    },
    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },
    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});
});
