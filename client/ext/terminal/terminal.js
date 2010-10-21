/**
 * Terminal Window Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/terminal/terminal",
    ["core/ide",
     "core/ext",
     "core/util",
     "ext/terminal/termlib",
     "ext/terminal/parser",
     "ext/console/console",
     "ext/noderunner/noderunner"],
    function(ide, ext, util, termlib, parserCls, console, noderunner) {

var terminal,
    termKey    = termlib.prototype.termKey,
    setDebug   = false,
    setRun     = false,
    parser     = new parserCls(),
    helpPage   = [
        "%CS%+r Terminal Help %-r%n",
        " ",
        "  Use one of the following commands:",
        "     clear [-a] .......... clear the terminal",
        "                           option 'a' also removes the status line",
        "     dump ................ lists all arguments and alphabetic options",
        "     login <username> .... sample login (test for raw mode)",
        "     ls .................. list directory contents. See ls(1) for more ",
        "                           information and arguments",
        "     pwd ................. return working directory name. See pwd(1) for",
        "                           more information and arguments",
        "     git <command> ....... the stupid content tracker. See git(1) for",
        "                           more information and arguments",
        "     open <filename> ..... open a file in a new Editor tab",
        "     c9 <filename> ....... alias for 'open'",
        "     run <filename> ...... attempts to run 'filename' in a NodeJS instance",
        "     debug <filename> .... attempts to open a debug session for 'filename'",
        "     help ................ show this help page",
        " "
    ];

function getCwd() {
    return terminal.$cwd.replace("/workspace",
        noderunner.workspaceDir.replace(/\/+$/, ""));
}

function termInitHandler() {
    this.write(["Type 'help' for a list of available commands.", "%n"]);
    // and leave with prompt
    this.prompt();
}

function commandHandler() {
    this.newLine();
    // check for raw mode first (should not be parsed)
    if (this.rawMode) {
        if (this.env.getPassword) {
            // sample password handler (lineBuffer == stored username ?)
            if (this.lineBuffer == this.env.username) {
                this.user = this.env.username;
                this.ps = "["+this.user+"]>";
                this.type("Welcome "+this.user+", you are now logged on to the system.");
            }
            else {
                this.type("Sorry.");
            }
            this.env.username = "";
            this.env.getPassword = false;
        }
        // leave in normal mode
        this.rawMode = false;
        this.prompt();
        return;
    }
    // normal command parsing
    // just call the termlib_parser with a reference of the calling Terminal instance
    // parsed arguments will be imported in this.argv,
    // quoting levels per argument in this.argQL (quoting character or empty)
    // cursor for arguments is this.argc (used by Parser.getopt)
    // => see 'termlib_parse.js' for configuration and details
    parser.parseLine(this);
    if (this.argv.length == 0) {
        // no commmand line input
    }
    else if (this.argQL[0]) {
        // first argument quoted -> error
        this.write("Syntax error: first argument quoted.");
    }
    else {
        var cmd = this.argv[this.argc++];
        // special commands (run & debug):
        if (cmd == "debug" || cmd == "run") {
            setDebug = (cmd == "debug");
            setRun   = (cmd == "run");
            cmd = "open";
        }
        switch (cmd) {
            case "help":
                this.write(helpPage);
                break;
            case "clear":
                // get options
                var opts = parser.getopt(this, "aA");
                if (opts.a) {
                    // discard status line on opt "a" or "A"
                    this.maxLines = this.conf.rows;
                }
                this.clear();
                break;
            case "login":
                // sample login (test for raw mode)
                if ((this.argc == this.argv.length) || (this.argv[this.argc] == "")) {
                    this.type("usage: login <username>");
                }
                else {
                    this.env.getPassword = true;
                    this.env.username = this.argv[this.argc];
                    this.write("%+iSample login: repeat username as password.%-i%n");
                    this.type("password: ");
                    // exit in raw mode (blind input)
                    this.rawMode = true;
                    this.lock = false;
                    return;
                }
                break;
            case "dump":
                var opts = parser.getopt(this, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
                for (var p in opts) {
                    if (p == "illegals") {
                        if (opts.illegals.length) {
                            this.type('  illegal options: "'+opts.illegals.join('", "')+'"');
                            this.newLine();
                        }
                    }
                    else {
                        this.type('  option "'+p+'" value '+opts[p].value);
                        this.newLine();
                    }
                }
                while (this.argc<this.argv.length) {
                    var ql = this.argQL[this.argc] || "-";
                    this.type('  argument [QL: '+ql+'] "'+this.argv[this.argc++]+'"');
                    this.newLine();
                }
                break;
            case "open":
            case "c9":
                this.argv[0] = "check-isfile"
                noderunner.socket.send(JSON.stringify({
                    command: "terminal",
                    argv: this.argv,
                    cwd: getCwd()
                }));
                break;
            default:
                this.cursorOn();
                noderunner.socket.send(JSON.stringify({
                    command: "terminal",
                    argv: this.argv,
                    cwd: getCwd()
                }));
                return;
        }
    }
    this.prompt();
}

function termExitHandler() {
    //do nothing.
}

function ctrlHandler() {
    var ch = this.inputChar;
    if (ch == termKey.TAB) {// || ch == termlib.termKey.ESC) {
        alert("TAB hit!");
    }
    else if (ch == termKey.ETX) {
        alert("C hit!");
    }
}

return terminal = ext.register("ext/terminal/terminal", {
    name     : "Terminal Window",
    dev      : "Ajax.org",
    type     : ext.GENERAL,
    alone    : true,
    markup   : null,
    hotkeys  : {"terminal":1},
    pageTitle: "Terminal",
    pageID   : "pgTerminal",
    hotitems : {},

    nodes    : [],

    hook : function(){
        var _self = this;
        this.nodes.push(
            console.mnuItem.parentNode.insertBefore(new apf.item({
                caption : "Terminal",
                onclick : function() {
                    _self.terminal();
                }
            }), console.mnuItem.nextSibling)
        );

        this.hotitems["terminal"] = [this.nodes[1]];
    },

    init : function(amlNode){
        var _self = this;
        this.$panel = tabConsole.add(this.pageTitle, this.pageID);
        var id  = this.pageID + "_divTerminalCont",
            bar = this.$panel.appendChild(new apf.bar({
                id: this.pageID + "Bar",
                skin: "terminal",
                focussable: true
            }));
        bar.$ext.setAttribute("id", id);
        // hide the debugger toolbar in the results tab
        tabConsole.addEventListener("beforeswitch", function(e) {
            tbDebug.setProperty("visible", (e.nextPage != _self.$panel));
        });
        // show the tab
        tabConsole.set(this.pageID);

        this.$cwd  = "/workspace";
        this.$term = new termlib({
            x: 0,
            y: 0,
            bgColor: "",
            frameColor: "",
            closeOnESC: false,
            termDiv: id,
            ps: this.getPrompt(),
            initHandler: termInitHandler,
            handler: commandHandler,
            exitHandler: termExitHandler,
            ctrlHandler: ctrlHandler
        });
        this.$term.open();
        this.$term.focus();
        tabConsole.addEventListener("afterswitch", function(e) {
            _self.onResize();
        });
        this.$panel.addEventListener("resize", this.onResize.bind(this));
        winDbgConsole.addEventListener("blur", function() {
            _self.$term.globals.disableKeyboard();
        });
        winDbgConsole.addEventListener("focus", function() {
            if (tabConsole.getPage() != _self.$panel)
                return;
            _self.$term.globals.enableKeyboard(_self.$term);
            _self.$term.cursorOn();
        });
        this.onResize();

        // connect to socket:
        noderunner.socket.on("message", this.onMessage.bind(this));
    },

    onResize: function() {
        var oNode = this.$panel.$ext,
            rowH  = this.$term.conf.rowHeight,
            cols  = Math.max(Math.floor(oNode.offsetWidth  / (rowH / 2), 10), 20),
            rows  = Math.max(Math.floor(oNode.offsetHeight / rowH, 10), 15);
        if (this.$term.maxCols === cols && this.$term.maxLines === rows)
            return;
        this.$term.resizeTo(cols, rows);
        termInitHandler.call(this.$term);
    },

    onMessage: function(message) {
        try {
            message = JSON.parse(message);
        }
        catch(e) {
            return;
        }

        if (message.type != "terminal")
            return;

        switch(message.subtype) {
            case "result-cd":
                if (message.body.cwd)
                    this.setPrompt(message.body.cwd);
                break;
            case "result-check-isfile":
                if (typeof message.body.cwd != "string")
                    break;
                var path = message.body.cwd.replace(
                    noderunner.workspaceDir.replace(/\/+$/, ""), "/workspace")
                if (message.body.isfile) {
                    require("ext/debugger/debugger").showFile(path);
                    if (setDebug || setRun) {
                        require("ext/run/run").run(setDebug === true);
                        setDebug = setRun = false;
                    }
                }
                else {
                    this.$term.write("%n'" + path + "' is not a file.%n", true);
                }
                break;
            default:
            case "error":
                if (typeof message.body == "string") {
                    this.$term.write("%n" + message.body
                        .replace(noderunner.workspaceDir.replace(/\/+$/, ""), "/workspace")
                        .replace(/%/g, "%%") + "%n", true);
                }
                break;
        }
    },

    setPrompt: function(cwd) {
        if (cwd)
            this.$cwd = cwd.replace(noderunner.workspaceDir.replace(/\/+$/, ""), "/workspace");
        this.$term.ps = this.getPrompt();
        this.$term.prompt();
        return this.$term.ps;
    },

    getPrompt: function() {
        return "[guest@cloud9]:" + this.$cwd + "$";
    },

    terminal: function() {
        // show the console (also used by the debugger):
        console.enable();
        ext.initExtension(this);
        // show the tab
        //tabConsole.set(this.pageID);
        if (this.$term)
            this.$term.focus();
    },

    enable : function(){
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