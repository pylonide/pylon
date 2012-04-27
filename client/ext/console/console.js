/**
 * Console for the Cloud9 IDE
 *
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 * @contributor Sergi Mansilla <sergi AT c9 DOT io>
 */

define(function(require, exports, module) {

var editors, parseLine; // These modules are loaded on demand
var predefinedCmds = require("ext/console/output");
var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("core/settings");
var Logger = require("ext/console/logger");
var code = require("ext/code/code");
var css = require("text!ext/console/console.css");
var markup = require("text!ext/console/console.xml");
var theme = require("text!ext/console/themes/arthur.css");
var InputHistory = require("ext/console/input_history");

// Some constants used throughout the plugin
var RE_band = /^\s*!/;
var KEY_TAB = 9, KEY_CR = 13, KEY_UP = 38, KEY_ESC = 27, KEY_DOWN = 40;
var actionCodes = [KEY_TAB, KEY_CR, KEY_UP, KEY_ESC, KEY_DOWN];

module.exports = ext.register("ext/console/console", {
    name   : "Console",
    dev    : "Cloud9 IDE, Inc.",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    css    : css + theme,
    height : 200,
    hidden : true,
    nodes  : [],
    autoOpen : true,
    minHeight : 150,
    inputHistory : new InputHistory(),

    command_id_tracer : 1,
    tracerToPidMap : {},

    allCommands : {},
    keyEvents   : {},
    commands    : {
        "help": {
            hint: "output a list of available commands"
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

    onMessageMethods: {
        cd: function(message, outputElDetails) {
            var res = message.body;
            if (res.cwd) {
                this.$cwd = res.cwd.replace(ide.workspaceDir, "/workspace");
                Logger.logNodeStream("Working directory changed", null, outputElDetails, ide);
            }
        },

        error: function(message, outputElDetails) {
            Logger.logNodeStream(message.body, null, outputElDetails, ide);
        },

        info: function (message, outputElDetails) {
            Logger.logNodeStream(message.body, null, outputElDetails, ide);
        },

        __default__: function(message, outputElDetails) {
            var res = message.body;
            if (res) {
                res.out && Logger.logNodeStream(res.out, null, outputElDetails, ide);
                res.err && Logger.logNodeStream(res.err, null, outputElDetails, ide);
            }
        }
    },

    getLogStreamOutObject : function(tracer_id) {
        var id = "section" + tracer_id;
        return {
            $ext : document.getElementById("console_" + id),
            id : id
        };
    },

    help: function(data) {
        var words = Object.keys(this.allCommands);
        var tabs = "\t\t\t\t";
        var _self = this;

        Logger.logNodeStream(
            words.sort()
                .map(function(w) { return w + tabs + _self.allCommands[w].hint; })
                .join("\n"),
            null, this.getLogStreamOutObject(data.tracer_id), ide
        );
    },

    clear: function() {
        if (txtConsole)
            txtConsole.clear();

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
            txtConsoleInput.focus()
        }
    },

    showOutput: function() {
        tabConsole.set(1);
    },

    getCwd: function() {
        return this.$cwd && this.$cwd.replace("/workspace", ide.workspaceDir);
    },

    write: function(lines, data) {
        if (typeof lines === "string")
            lines = lines.split("\n");

        var lsOutObject = this.getLogStreamOutObject(data.tracer_id);
        lines.forEach(function(line) {
            Logger.logNodeStream(line, null, lsOutObject, ide);
        });
    },

    keyupHandler: function(e) {
        if (actionCodes.indexOf(e.keyCode) !== -1)
            return this.commandTextHandler(e);
    },

    keydownHandler: function(e) {
        if (actionCodes.indexOf(e.keyCode) === -1)
            return this.commandTextHandler(e);
    },

    evalCmd: function(line) {
        parseLine || (parseLine = require("ext/console/parser"));
        var argv = parseLine(line);
        if (!argv || argv.length === 0) // no commmand line input
            return;

        // Replace any quotes in the command
        argv[0] = argv[0].replace(/["'`]/g, "");
        this.inputHistory.push(line);

        var spinnerBtn = ['<div class="prompt_spinner" ', 'id="spinner',
            this.command_id_tracer,
            '" onclick="return require(\'ext/console/console\').handleCliBlockAction(event)"></div>']
            .join("");

        var outputId = "console_section" + this.command_id_tracer;
        Logger.log(this.getPrompt(line), "prompt", spinnerBtn,
            '<div class="prompt_spacer"></div>', null, outputId);

        var outputEl = document.getElementById(outputId);
        apf.setStyleClass(outputEl, "loading");

        tabConsole.set("console");

        var showConsole = true;
        var cmd = argv[0];

        var defCmd = predefinedCmds.getPredefinedOutput(argv);
        if (defCmd !== "") {
            this.commandCompleted(this.command_id_tracer);
            Logger.logNodeStream(defCmd, null,
                this.getLogStreamOutObject(this.command_id_tracer), ide);
            this.command_id_tracer++;
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
                requireshandling: true,
                tracer_id: this.command_id_tracer
            };

            if (cmd.trim() === "npm")
                data.version = settings.model.queryValue("auto/node-version/@version") || "auto";

            showConsole = this.execAction(cmd, data);
        }

        if (showConsole === true)
            this.show();
    },

    // Executes a command (presumably coming from the CLI).
    execAction : function(cmd, data) {
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
                if (!ide.onLine) {
                    this.write("Cannot execute command. You are currently offline.", {
                        tracer_id : this.command_id_tracer
                    });
                }
                else {
                    data.extra = {
                        command_id : this.command_id_tracer
                    };

                    ide.send(data);
                }
            }
            else {
                // If any of the `consolecommand` events returns false, it means
                // that we don't want the console to show up.
                return false;
            }
        }

        this.command_id_tracer++;
        return true;
    },

    commandTextHandler: function(e) {
        var code = e.keyCode;
        if (this.keyEvents[code])
            this.keyEvents[code](e.currentTarget);
    },

    commandCompleted: function(id) {
        var spinnerElement = document.getElementById("spinner" + id);
        if (spinnerElement) {
            var pNode = spinnerElement.parentNode;
            if (pNode.className.indexOf("quitting") !== -1) {
                apf.setStyleClass(pNode, "quit_proc", ["quitting_proc"]);
                Logger.logNodeStream("Process successfully quit", null,
                    this.getLogStreamOutObject(id), ide);
            }

            Firmin.animate(spinnerElement, {
                opacity : 0,
                delay : 0.2 },
            0.3, function() {
                spinnerElement.setAttribute("style", "");
                apf.setStyleClass(spinnerElement.parentNode, "loaded", ["loading"]);
                setTimeout(function() {
                    spinnerElement.style.opacity = "1";
                }, 100);
            });
        }
    },

    onMessage: function(e) {
        if (!e.message.type)
            return;

        console.log(e.message);
        var message = e.message;
        var extra = message.extra;
        if (!extra && message.body)
            extra = message.body.extra;

        switch(message.type) {
            case "node-data":
                Logger.logNodeStream(message.data, message.stream, true, ide);
                return;
            case "node-exit":
                Logger.log("", "divider", null, null, true);
                return;
            case "kill":
                if (message.err) {
                    Logger.logNodeStream(message.err, null,
                        this.getLogStreamOutObject(extra.command_id), ide);
                }
                break;
            default:
                if (message.type.match(/-start$/)) {
                    this.tracerToPidMap[extra.command_id] = message.pid;
                    var containerEl = this.getLogStreamOutObject(extra.command_id).$ext;
                    containerEl.setAttribute("rel", extra.command_id);
                    apf.setStyleClass(containerEl, "has_pid");
                    return;
                }

                if (message.type.match(/-data$/)) {
                    Logger.logNodeStream(message.data, message.stream,
                        this.getLogStreamOutObject(extra.command_id), ide);
                    return;
                }

                if (message.type.match(/-exit$/)) {
                    this.commandCompleted(extra.command_id);
                    return;
                }
                break;
        }

        // If we get to this point and `extra` is available, it's a process that
        // sends all its stdout _after_ it has quit. Thus, we complete it here
        if (extra)
            this.commandCompleted(extra.command_id);

        if (message.type !== "result")
            return;

        var outputElDetails;
        if (extra)
            outputElDetails = this.getLogStreamOutObject(extra.command_id);
        if (this.onMessageMethods[message.subtype])
            this.onMessageMethods[message.subtype].call(this, message, outputElDetails);
        else
            this.onMessageMethods.__default__.call(this, message, outputElDetails);

        ide.dispatchEvent("consoleresult." + message.subtype, {
            data: message.body
        });
    },

    getPrompt: function(suffix) {
        var u = this.username;
        if (!u)
            u = (ide.workspaceId.match(/user\/(\w+)\//) || [,"guest"])[1];

        return "[" + u + "@cloud9]:" + this.$cwd + "$" + ((" " + suffix) || "");
    },

    hook: function() {
        var _self = this;
        // Listen for new extension registrations to add to the hints
        ide.addEventListener("ext.register", function(e){
            if (e.ext.commands)
                apf.extend(_self.allCommands, e.ext.commands);
        });

        ext.initExtension(this);
    },

    init: function(){
        var _self = this;
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

        this.keyEvents[KEY_UP] = function(input) {
            var newVal = _self.inputHistory.getPrev() || "";
            input.setValue(newVal);
        };
        this.keyEvents[KEY_DOWN] = function(input) {
            var newVal = _self.inputHistory.getNext() || "";
            input.setValue(newVal);
        };
        this.keyEvents[KEY_CR] = function(input) {
            var inputVal = input.getValue().trim();
            if (inputVal === "/?")
                return false;
            _self.evalCmd(inputVal);
            input.setValue("");
        };

        // To be uncommented and fully implemented when merged with navbar
        /*code.commandManager.addCommand({
            name: "abortclicommand",
            bindKey: {mac: "Ctrl-C", win: "Ctrl-C"},
            available : function(){
                return apf.activeElement === txtConsoleInput;
            },
            exec: function () {
                var selection = window.getSelection();
                var range = selection.getRangeAt(0);
                console.log("range", range);
                if (range.endOffset - range.startOffset === 0)
                    _self.cancelCliAction();
            }
        });*/

        apf.extend(this.allCommands, ext.commandsLut);

        // For now, until the local client gets upgraded
        if (window.cloud9config.hosted)
            apf.setStyleClass(txtConsole.$ext, "feedback");
    },

    handleCliBlockAction : function(e) {
        var pNode = e.target.parentNode;

        if (pNode.className.indexOf("loaded") !== -1) {
            if (pNode.className.indexOf("collapsed") !== -1)
                this.expandCliBlock(pNode);
            else
                this.collapseCliBlock(pNode);
        }
        else {
            this.cancelCliAction(pNode);
        }
    },

    /**
     * Cancel a CLI command. If `pNode` is undefined, it will subtract 1 from
     * `this.command_id_tracer`. `pNode` would be undefined if the user pressed
     * ctrl-c in the input area
     * 
     * @param DOMElement pNode The parent container block of the close button
     */
    cancelCliAction : function(pNode) {
        var command_id;
        if (typeof pNode === "undefined")
            command_id = (this.command_id_tracer - 1)
        else
            command_id = parseInt(pNode.getAttribute("rel"), 10);

        var pid = this.tracerToPidMap[command_id];
        if (!pid)
            return;

        apf.setStyleClass(pNode, "quitting_proc");
        Logger.logNodeStream("Killing this process...", null,
            this.getLogStreamOutObject(command_id), ide);

        ide.send({
            command: "kill",
            pid: pid
        });
    },

    /**
     * Expands a CLI block (prompt, stdin and stdout) from its collapsed state.
     * This can happen from both clicking the expand arrow and also clicking on
     * the collapsed block itself.
     *
     * @param DOMElement pNode The container block to be expanded
     * @param Event e The click event
     */
    expandCliBlock : function(pNode, e) {
        if (typeof e !== "undefined" && e.target.className.indexOf("prompt_spinner") !== -1)
            return;

        var height = parseInt(pNode.getAttribute("rel"), 10);
        apf.setStyleClass(pNode, null, ["collapsed"]);
        Firmin.animate(pNode, {
            height : height + "px"
        }, 0.2, function() {
            apf.layout.forceResize(tabConsole.$ext);
        });
    },

    /**
     * Collapses a CLI block (prompt, stdin and stdout) down to just the prmompt
     * and stdin line
     *
     * @param DOMElement pNode The container block to be collapsed
     */
    collapseCliBlock : function(pNode) {
        // 20 = padding
        var startingHeight = apf.getHtmlInnerHeight(pNode) - 20;
        pNode.style.height = startingHeight + "px";
        pNode.setAttribute("rel", startingHeight);
        apf.setStyleClass(pNode, "collapsed");
        Firmin.animate(pNode, {
            height : "14px"
        }, 0.2, function() {
            apf.layout.forceResize(tabConsole.$ext);
        });

        pNode.setAttribute("onclick", 'require("ext/console/console").expandCliBlock(this, event)');
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

        var _self = this;
        var cfg;
        if (shouldShow) {
            cfg = {
                height: this.height,
                dbgVisibleMethod: "show",
                chkExpandedMethod: "check",
                animFrom: this.height*0.95,
                animTo: this.height > this.minHeight ? this.height : this.minHeight,
                animTween: "easeOutQuint"
            };

            tabConsole.show();
            apf.setStyleClass(btnCollapseConsole.$ext, "btn_console_openOpen");
        }
        else {
            cfg = {
                height: 34,
                dbgVisibleMethod: "hide",
                chkExpandedMethod: "uncheck",
                animFrom: this.height > this.minHeight ? this.height : this.minHeight,
                animTo: 65,
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
            chkConsoleExpanded[cfg.chkExpandedMethod]();
        };

        var animOn = apf.isTrue(settings.model.queryValue("general/@animateui"));
        if (!immediate && animOn) {
            apf.tween.single(winDbgConsole.$ext, {
                control : this.$control = {},
                type  : "height",
                anim  : apf.tween[cfg.animTween],
                from  : cfg.animFrom,
                to    : cfg.animTo,
                steps : 8,
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

