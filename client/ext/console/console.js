/**
 * Console for the Cloud9 IDE
 *
 * The console plugin takes care of rendering a CLI at the bottom of the IDE and
 * of sending user input and parsing and outputting stdout in the
 * console.
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 * @contributor Sergi Mansilla <sergi AT c9 DOT io>
 */

define(function(require, exports, module) {

var editors, parseLine, predefinedCmds; // These modules are loaded on demand
var ide = require("core/ide");
var menus = require("ext/menus/menus");
var ext = require("core/ext");
var settings = require("core/settings");
var Logger = require("ext/console/logger");
var css = require("text!ext/console/console.css");
var markup = require("text!ext/console/console.xml");
var theme = require("text!ext/console/themes/arthur.css");

// Some constants used throughout the plugin
var RE_band = /^\s*!/;
var KEY_TAB = 9, KEY_CR = 13, KEY_UP = 38, KEY_ESC = 27, KEY_DOWN = 40;
var actionCodes = [KEY_TAB, KEY_CR, KEY_UP, KEY_ESC, KEY_DOWN];

// Executes a command (presumably coming from the CLI).
var execAction = function(cmd, data) {
    ide.dispatchEvent("track_action", {
        type: "console",
        cmd: cmd,
        argv: data.argv
    });

    if (ext.execCommand(cmd, data) !== false) {
        var commandEvt = "consolecommand." + cmd;
        var consoleEvt = "consolecommand";
        var commandEvResult = ide.dispatchEvent(commandEvt, { data: data });
        var consoleEvResult = ide.dispatchEvent(consoleEvt, { data: data });

        if (commandEvResult !== false && consoleEvResult !== false) {
            if (!ide.onLine)
                this.write("Cannot execute command. You are currently offline.");
            else
                ide.send(data);
        }
        else {
            // If any of the `consolecommand` events returns false, it means
            // that we don't want the console to show up.
            return false;
        }
    }
    return true;
};

// This object is a simple FIFO queue that keeps track of the list of commands
// introduced by the user at any given time and allows the console to go back and forward.
var cmdHistory = {
    _history: [],
    _index: 0,

    push: function(cmd) {
        this._history.push(cmd);
        this._index = this.length();
    },
    length: function() {
        return this._history.length;
    },
    getNext: function() {
        this._index += 1;
        var cmd = this._history[this._index] || "";
        this._index = Math.min(this.length(), this._index);

        return cmd;
    },
    getPrev: function() {
        this._index = Math.max(0, this._index - 1);
        return this._history[this._index];
    }
};

module.exports = ext.register("ext/console/console", {
    name   : "Console",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    css    : css + theme,
    height : 200,
    hidden : true,
    hiddenInput : true,
    
    nodes : [],
    
    minHeight : 150,
    collapsedHeight : 30,
    $collapsedHeight : 0,

    autoOpen : true,
    excludeParent : true,
    allCommands: {},
    keyEvents: {},
    commands: {
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
        
        error: function(message) {
            Logger.log(message.body);
            Logger.log("", "divider");
        },
        
        /**
         * Info does the same as error in this case
         * but it's here for the future, we might want to distinguise these
         * on colors or something...
         */
        info: function (message) {
            Logger.log(message.body);
            Logger.log("", "divider");
        },
        
        __default__: function(message) {
            var res = message.body;
            if (res) {
                res.out && Logger.logNodeStream(res.out, null, null, ide);
                res.err && Logger.logNodeStream(res.err, null, null, ide);
                res.code && Logger.log("", "divider"); // End of command
            }
        }
    },

    help: function() {
        var words = Object.keys(this.allCommands);
        var tabs = "\t\t\t\t";
        var _self = this;

        Logger.logNodeStream(
            words.sort()
                .map(function(w) { return w + tabs + _self.allCommands[w].hint; })
                .join("\n"),
            null, null, ide
        );
    },

    clear: function() {
        if (txtConsole) {
            txtConsole.clear();
        }
        
        return false;
    },

    switchconsole : function() {
        if (apf.activeElement === txtConsoleInput) {
            if (window.ceEditor) {
                ceEditor.focus();
                this.hide();
            }
        }
        else {
            this.show();
            txtConsoleInput.focus()
        }
    },

    showOutput: function() {
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
        parseLine || (parseLine = require("ext/console/parser"));
        var argv = parseLine(line);
        if (!argv || argv.length === 0) // no commmand line input
            return;

        // Replace any quotes in the command
        argv[0] = argv[0].replace(/["'`]/g, "");
        cmdHistory.push(line);
        Logger.log(this.getPrompt(line), "prompt");
        tabConsole.set("console");

        var showConsole = true;
        var cmd = argv[0];

        predefinedCmds || (predefinedCmds = require("ext/console/output"));
        var defCmd = predefinedCmds.getPredefinedOutput(argv);
        if (defCmd !== "") {
            this.write(defCmd);
        }
        else {
            if (cmd.trim().charAt(0) === "!") {
                cmd = "bash";
                argv[0] = argv[0].replace(RE_band, "");
                line = line.replace(RE_band, "");
            }

            var data = {
                command: cmd,
                argv: argv,
                line: line,
                cwd: this.getCwd(),
                // the requireshandling flag indicates that this message cannot
                // be silently ignored by the server.
                // An error event should be thrown if no plugin handles this message.
                requireshandling: true
            };

            if (cmd.trim() === "npm")
                data.version = settings.model.queryValue("auto/node-version/@version") || "auto";

            showConsole = execAction(cmd, data);
        }
        if (showConsole === true) this.show();
    },

    commandTextHandler: function(e) {
        var code = e.keyCode;
        if (this.keyEvents[code])
            this.keyEvents[code](e.currentTarget);
    },

    onMessage: function(e) {
        var message = e.message;
        if (!message.type)
            return;
        if (message.type === "node-data")
            return Logger.logNodeStream(message.data, message.stream, true, ide);

        if (message.type === "node-exit")
            return Logger.log("", "divider", null, null, true);

        if (message.type.match(/-data$/))
            return Logger.logNodeStream(message.data, message.stream, false, ide);

        if (message.type.match(/-exit$/))
            return Logger.log("", "divider", false);

        if (message.type !== "result")
            return;

        if (this.messages[message.subtype])
            this.messages[message.subtype].call(this, message);
        else
            this.messages.__default__.call(this, message);

        ide.dispatchEvent("consoleresult." + message.subtype, { data: message.body });
    },

    getPrompt: function(suffix) {
        var u = this.username;
        if (!u)
            u = (ide.workspaceId.match(/user\/(\w+)\//) || [,"guest"])[1];

        return "[" + u + "@cloud9]:" + this.$cwd + "$" + ((" " + suffix) || "");
    },
    
    hook: function() {
        var _self = this;
        
        //@todo this should be done via ide.commandManager instead
        // Listen for new extension registrations to add to the
        // hints
        ide.addEventListener("ext.register", function(e){
            if (e.ext.commands)
                apf.extend(_self.allCommands, e.ext.commands);
        });
        
        ide.commandManager.addCommand({
            name: "toggleconsole",
            exec: function () {
                if (_self.hidden)
                    _self.show();
                else
                    _self.hide();
            }
        });
        
        ide.commandManager.addCommand({
            name: "toggleinputbar",
            exec: function () {
                if (_self.hiddenInput)
                    _self.showInput();
                else
                    _self.hideInput();
            }
        });
        
        this.nodes.push(
            this.mnuItemConsoleExpanded = menus.addItemByPath("View/Console", new apf.item({
                type    : "check",
                command : "toggleconsole",
                checked : "[{require('ext/settings/settings').model}::auto/console/@show]"
            }), 700),
            this.mnuItemInput = menus.addItemByPath("View/Command Line", new apf.item({
                type    : "check",
                command : "toggleinputbar",
                checked : "[{require('ext/settings/settings').model}::auto/console/@showinput]"
            }), 800)
        );

        menus.addItemByPath("Tools/~", new apf.divider(), 30000),
        menus.addItemByPath("Tools/Git/", null, 40000),
        menus.addItemByPath("Tools/Git/Push", new apf.item({}), 1000),
        menus.addItemByPath("Tools/Git/Pull", new apf.item({}), 2000),
        menus.addItemByPath("Tools/Git/Stash", new apf.item({}), 3000),
        menus.addItemByPath("Tools/Git/Commit", new apf.item({}), 4000),
        menus.addItemByPath("Tools/Git/Checkout", new apf.item({}), 5000),

        // should probably do HG, too...

        menus.addItemByPath("Tools/~", new apf.divider(), 50000),
        menus.addItemByPath("Tools/NPM/", null, 60000),
        menus.addItemByPath("Tools/NPM/Install", new apf.item({}), 1000),
        menus.addItemByPath("Tools/NPM/Uninstall", new apf.item({}), 2000)
        
        ide.addEventListener("loadsettings", function(e){
            if (!e.model.queryNode("auto/console/@autoshow"))
                e.model.setQueryValue("auto/console/@autoshow", true);

            _self.height = e.model.queryValue("auto/console/@height") || _self.height;

            if (apf.isTrue(e.model.queryValue("auto/console/@maximized"))) {
                _self.show(true);
                _self.maximize();
            }
            else if (apf.isTrue(e.model.queryValue("auto/console/@expanded")))
                _self.show(true);
            
            if (apf.isTrue(e.model.queryValue("auto/console/@showinput")))
                _self.showInput();
        });
    },

    init: function(amlNode){
        var _self = this;
        
        this.panel = tabConsole;
        this.$cwd  = "/workspace"; // code smell
        
        apf.importCssString(this.css);
        
        // Append the console window at the bottom below the tab
        mainRow.appendChild(winDbgConsole);
        winDbgConsole.previousSibling.hide();

        stProcessRunning.addEventListener("activate", function() {
            _self.showOutput();

            var autoshow = settings.model.queryValue("auto/console/@autoshow");
            if (_self.autoOpen && apf.isTrue(autoshow))
                _self.show();
        });

        // before the actual run target gets called we clear the console
        ide.addEventListener("beforeRunning", function () {
            _self.clear();
        });

        ide.addEventListener("socketMessage", this.onMessage.bind(this));
        ide.addEventListener("consoleresult.internal-isfile", function(e) {
            var data = e.data;
            var path = data.cwd.replace(ide.workspaceDir, ide.davPrefix);
            if (!editors)
                editors = require("ext/editors/editors");
            if (data.isfile)
                editors.showFile(path);
            else
                Logger.log("'" + path + "' is not a file.");
        });

        txtConsoleInput.addEventListener("keyup", this.keyupHandler.bind(this));
        txtConsoleInput.addEventListener("keydown", this.keydownHandler.bind(this));

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
            settings.model.setQueryValue("auto/console/@active", e.nextPage.name);
            setTimeout(function(){
                txtConsoleInput.focus();
            });
        });

        winDbgConsole.previousSibling.addEventListener("dragdrop", function(e){
            settings.model.setQueryValue("auto/console/@height",
                _self.height = winDbgConsole.height)
        });

        this.nodes.push(
            winDbgConsole
        );

        this.keyEvents[KEY_UP] = function(input) {
            var newVal = cmdHistory.getPrev();
            if (newVal)
                input.setValue(newVal);
        };
        this.keyEvents[KEY_DOWN] = function(input) {
            var newVal = cmdHistory.getNext();
            if (newVal)
                input.setValue(newVal);
            else
                input.setValue("");
        };
        this.keyEvents[KEY_CR] = function(input) {
            var inputVal = input.getValue().trim();
            if (inputVal === "/?")
                return false;
            _self.evalCmd(inputVal);
            input.setValue("");
        };

        apf.extend(this.allCommands, ext.commandsLut);
    },

    maximize: function(){
        if (this.maximized)
            return;
        this.maximized = true;

        apf.document.documentElement.appendChild(winDbgConsole);
        winDbgConsole.setAttribute('anchors', '0 0 0 0');
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
    
    showInput : function(){
        if (!this.hiddenInput)
            return;
        
        ext.initExtension(this);
        
        this.$collapsedHeight = this.collapsedHeight;
        if (this.hidden)
            winDbgConsole.setAttribute("height", this.collapsedHeight + "px")
        txtConsoleInput.parentNode.show();
        apf.layout.forceResize();
        
        this.hiddenInput = false;
    },
    
    hideInput : function(){
        if (!this.inited || this.hiddenInput)
            return;
        
        this.$collapsedHeight = 0;
        if (this.hidden)
            winDbgConsole.setAttribute("height", "0")
        txtConsoleInput.parentNode.hide();
        apf.layout.forceResize();
        
        this.hiddenInput = true;
    },

    show: function(immediate) { ext.initExtension(this); this._show(true, immediate); },
    hide: function(immediate) { this._show(false, immediate); },

    _show: function(shouldShow, immediate) {
        if (this.hidden != shouldShow)
            return;
            
        this.hidden = !shouldShow;

        if (this.$control)
            this.$control.stop();
        
        var _self = this;
        var cfg;
        if (shouldShow) {
            cfg = {
                height: this.height,
                dbgVisibleMethod: "show",
                mnuItemLabel: "check",
                animFrom: this.$collapsedHeight,
                animTo: this.height > this.minHeight ? this.height : this.minHeight,
                steps: 5,
                animTween: "easeOutQuint"
            };

            tabConsole.show();
            apf.setStyleClass(btnCollapseConsole.$ext, "btn_console_openOpen");
        }
        else {
            cfg = {
                height: this.$collapsedHeight,
                dbgVisibleMethod: "hide",
                mnuItemLabel: "uncheck",
                animFrom: this.height > this.minHeight ? this.height : this.minHeight,
                animTo: this.$collapsedHeight,
                steps: 5,
                animTween: "easeInOutCubic"
            };

            if (winDbgConsole.parentNode != mainRow)
                this.restore();

            apf.setStyleClass(btnCollapseConsole.$ext, "", ["btn_console_openOpen"]);
            winDbgConsole.$ext.style.minHeight = 0;
        }

        var finish = function() {
            if (!shouldShow)
                tabConsole.hide();
            else
                winDbgConsole.$ext.style.minHeight = _self.minHeight + "px";

            winDbgConsole.height = cfg.height + 1;
            winDbgConsole.setAttribute("height", cfg.height);
            winDbgConsole.previousSibling[cfg.dbgVisibleMethod]();
            apf.layout.forceResize();

            settings.model.setQueryValue("auto/console/@expanded", shouldShow);
        };

        var animOn = apf.isTrue(settings.model.queryValue("general/@animateui"));
        if (!immediate && animOn) {
            apf.tween.single(winDbgConsole.$ext, {
                control : this.$control = {},
                type  : "height",
                anim  : apf.tween[cfg.animTween],
                from  : cfg.animFrom,
                to    : cfg.animTo,
                steps : cfg.steps,
                interval : 5,
                onfinish : finish,
                oneach : function() { apf.layout.forceResize(); }
            });
        }
        else {
            finish();
        }
    },
    enable: function(){
        this.nodes.each(function(item) { item.enable(); });
    },

    disable: function(){
        this.nodes.each(function(item) { item.disable(); });
    },

    destroy: function(){
        this.nodes.each(function(item) { item.destroy(true, true); });
        this.nodes = [];
    }
});
});

