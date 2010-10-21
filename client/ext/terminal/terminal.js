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
    parser     = new parserCls(),
    rszTimeout = null,
    helpPage   = [
        "%CS%+r Terminal Help %-r%n",
        "  This is just a sample to demonstrate command line parsing.",
        " ",
        "  Use one of the following commands:",
        "     clear [-a] .......... clear the terminal",
        "                           option 'a' also removes the status line",
        "     number -n<value> .... return value of option 'n' (test for options)",
        "     repeat -n<value> .... repeats the first argument n times (another test)",
        "     dump ................ lists all arguments and alphabetic options",
        "     login <username> .... sample login (test for raw mode)",
        "     exit ................ close the terminal (same as <ESC>)",
        "     help ................ show this help page",
        " ",
        "  other input will be echoed to the terminal as a list of parsed arguments",
        "  in the format <argument index> <quoting level> '<parsed value>'.",
        " "
    ];

function termInitHandler() {
    // set a double status line
    this.statusLine("", 8, 2); // just a line of strike
    this.statusLine(" +++ Type 'help' for a list of available commands. +++");
    this.maxLines -= 2;
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
        /*
        process commands now
        1st argument: this.argv[this.argc]
        */
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
            case "number":
                // test for value options
                var opts = parser.getopt(this, "n");
                if (opts.illegals.length) {
                    this.type("illegal option. usage: number -n<value>");
                }
                else if ((opts.n) && (opts.n.value != -1)) {
                    this.type("option value: "+opts.n.value);
                }
                else {
                    this.type("usage: number -n<value>");
                }
                break;
            case "repeat":
                // another test for value options
                var opts = parser.getopt(this, "n");
                if (opts.illegals.length) {
                    this.type("illegal option. usage: repeat -n<value> <string>");
                }
                else if ((opts.n) && (opts.n.value != -1)) {
                    // first normal argument is again this.argv[this.argc]
                    var s = this.argv[this.argc];
                    if (typeof s != "undefined") {
                        // repeat this string n times
                        var a = [];
                        for (var i=0; i<opts.n.value; i++) a[a.length] = s;
                        this.type(a.join(" "));
                    }
                }
                else {
                    this.type("usage: repeat -n<value> <string>");
                }
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
            case "exit":
                this.close();
                return;
            default:
                noderunner.socket.send(JSON.stringify({
                    command: "terminal",
                    argv: this.argv,
                    cwd: terminal.$cwd.replace("/workspace", noderunner.workspaceDir.replace(/\/+$/, ""))
                }))
                return;
        }
    }
    this.prompt();
}

function termExitHandler() {
    // reset the UI
    var mainPane = (document.getElementById)?
        document.getElementById("mainPane") : document.all.mainPane;
    if (mainPane)
        mainPane.className = "lh15";
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
    fontSize : 12,
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
        apf.importCssString("\
.term {\
    font-family: courier,fixed,swiss,sans-serif;\
    font-size: " + this.fontSize + "px;\
    color: #33d011;\
    background: none;\
}\
.termReverse {\
    color: #111111;\
    background: #33d011;\
}");
        var _self = this;
        this.$panel = tabConsole.add(this.pageTitle, this.pageID);
        var div   = this.$panel.$ext.appendChild(document.createElement("div")),
            id    = this.pageID + "_divTerminalCont";
        div.setAttribute("id", id);
        // hide the debugger toolbar in the results tab
        tabConsole.addEventListener("beforeswitch", function(e) {
            tbDebug.setProperty("visible", (e.nextPage != _self.$panel));
        });
        // show the tab
        tabConsole.set(this.pageID);

        this.$cwd  = "/workspace";
        this.$term = new termlib({
            termDiv: id,
            ps: this.getPrompt(),
            initHandler: termInitHandler,
            handler: commandHandler,
            exitHandler: termExitHandler
        });
        this.$term.open();
        this.$term.focus();
        tabConsole.addEventListener("afterswitch", function(e) {
            _self.onResize();
        });
        this.$panel.addEventListener("resize", this.onResize.bind(this));
        apf.addEventListener("focus", function() {
            _self.$term.globals.disableKeyboard();
        });
        apf.addEventListener("blur", function() {
            _self.$term.globals.enableKeyboard(_self.$term);
        });
        this.onResize();

        // connect to socket:
        noderunner.socket.on("message", this.onMessage.bind(this));
    },

    onResize: function() {
        clearTimeout(rszTimeout);
        var oNode = this.$panel.$ext,
            cols  = Math.max(Math.floor(oNode.offsetWidth  / (this.fontSize - 5), 10), 20),
            rows  = Math.max(Math.floor(oNode.offsetHeight / (this.fontSize + 1), 10), 15);
        this.$term.resizeTo(cols, rows);
        var _self = this;
        rszTimeout = setTimeout(function() {
            termInitHandler.call(_self.$term);
        }, 200);
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
            default:
            case "error":
                if (typeof message.body == "string")
                    this.$term.write(message.body
                        .replace(noderunner.workspaceDir.replace(/\/+$/, ""), "/workspace")
                        .replace(/%/g, "%%") + "%n", true);
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