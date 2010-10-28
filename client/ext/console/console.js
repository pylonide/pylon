/**
 * Console for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/console/console",
    ["core/ide",
     "core/ext",
     "ace/lib/lang",
     "ext/panels/panels",
     "ext/console/parser",
     "text!ext/console/console.xml"],
    function(ide, ext, lang, panels, parserCls, markup) {

var setDebug   = false,
    setRun     = false,
    cmdHistory = [],
    parser     = new parserCls(),
    helpPage   = [
        "%CS%+r Terminal Help %-r",
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

return ext.register("ext/console/console", {
    name   : "Console",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,

    clear : function() {
        this.inited && txtConsole.clear();
    },

    jump: function(path, row, column) {
        row = parseInt(row.slice(1));
        column = column ? parseInt(column.slice(1)) : 0;
        require("ext/debugger/debugger").showFile(path, row, column);
    },

    logNodeStream : function(data, stream, workspaceDir, davPrefix) {
        var colors = {
            30: "black",
            31: "red",
            32: "green",
            33: "yellow",
            34: "blue",
            35: "magenta",
            36: "cyan",
            37: "white"
        };

        var lines = data.split("\n");
        var style = "color:black;";
        var log = [];
        // absolute workspace files
        var wsRe = new RegExp(lang.escapeRegExp(workspaceDir) + "\\/([^:]*)(:\\d+)(:\\d+)*", "g");
        // relative workspace files
        var wsrRe = /(?:\s|^|\.\/)([\w\_\$-]+(?:\/[\w\_\$-]+)+(?:\.[\w\_\$]+))?(\:\d+)(\:\d+)*/g;
        
        for (var i=0; i<lines.length; i++) {
            if (!lines[i]) continue;

            log.push("<div class='item'><span style='" + style + "'>" + lines[i]
                .replace(/\s/g, "&nbsp;")
                .replace(wsrRe, "<a href='javascript:void(0)' onclick='require(\"ext/console/console\").jump(\"/" + davPrefix + "$1\", \"$2\", \"$3\")'>$1$2$3</a>")
                .replace(wsRe, "<a href='javascript:void(0)' onclick='require(\"ext/console/console\").jump(\"/" + davPrefix + "$1\", \"$2\", \"$3\")'>"+workspaceDir+"/$1$2$3</a>")
                .replace(/(((http:\/\/)|(www\.))[\w\d\.]*(:\d+)?(\/[\w\d]+)?)/, "<a href='$1' target='_blank'>$1</a>")
                .replace(/\033\[(?:(\d+);)?(\d+)m/g, function(m, extra, color) {
                    style = "color:" + (colors[color] || "black");
                    if (extra == 1) {
                        style += ";font-weight=bold"
                    } else if (extra == 4) {
                        style += ";text-decoration=underline";
                    }
                    return "</span><span style='" + style + "'>"
                }) + "</span></div>");
        }
        txtConsole.addValue(log.join(""));
    },

    log : function(msg, type, pre, post){
        msg = apf.htmlentities(String(msg));

        if (!type)
            type = "log";
        else if (type == "command") {
            msg = "<span style='color:blue'><span style='float:left'>&gt;&gt;&gt;</span><div style='margin:0 0 0 25px'>"
                + msg + "</div></span>";
        }

        txtConsole.addValue("<div class='item console_" + type + "'>" + (pre || "") + msg + (post || "") + "</div>");
    },

    write: function(aLines) {
        if (typeof aLines == "string")
            aLines = aLines.split("\n");
        for (var i = 0, l = aLines.length; i < l; ++i)
            this.log(aLines[i], "log")
    },

    evaluate : function(expression, callback){
        var _self = this;
        var frame = dgStack && dgStack.selected && dgStack.selected.getAttribute("ref") || null;
        dbg.evaluate(expression, frame, null, null, callback || function(xmlNode){
            _self.showObject(xmlNode);
        });
    },

    checkChange : function(xmlNode){
        var value = xmlNode.getAttribute("value");
        if (xmlNode.tagName == "method" || "Boolean|String|undefined|null|Number".indexOf(xmlNode.getAttribute("type")) == -1)
            return false;
    },

    applyChange : function(xmlNode){
        var value = xmlNode.getAttribute("value");
        var name = this.calcName(xmlNode);
        try{
            if (name.indexOf(".") > -1) {
                var prop, obj = self.parent.eval(name.replace(/\.([^\.\s]+)$/, ""));
                if (obj && obj.$supportedProperties && obj.$supportedProperties.contains(prop = RegExp.$1)) {
                    obj.setProperty(prop, self.parent.eval(value));
                    return;
                }
            }

            self.parent.eval(name + " = " + value);

            //@todo determine new type
        }
        catch(e) {
            trObject.getActionTracker().undo();
            alert("Invalid Action: " + e.message);
            //@todo undo
        }
    },

    calcName : function(xmlNode, useDisplay){
        var isMethod = xmlNode.tagName == "method";
        var name, loopNode = xmlNode, path = [];
        do {
            name = useDisplay
                ? loopNode.getAttribute("display") || loopNode.getAttribute("name")
                : loopNode.getAttribute("name");

            if (!name)
                break;

            path.unshift(!name.match(/^[a-z_\$][\w_\$]*$/i)
                ? (parseInt(name) == name
                    ? "[" + name + "]"
                    : "[\"" + name.replace(/'/g, "\\'") + "\"]")
                : name);
            loopNode = loopNode.parentNode;
            if (isMethod) {
                loopNode = loopNode.parentNode;
                isMethod = false;
            }
        }
        while (loopNode && loopNode.nodeType == 1);

        if (path[0].charAt(0) == "[")
            path[0] = path[0].substr(2, path[0].length - 4);
        return path.join(".").replace(/\.\[/g, "[");
    },

    commandTextHandler: function(e) {
        console.log("keyCode: ", e.keyCode);
        if (e.keyCode == 38) { //UP

        }
        else if (e.keyCode == 40) { //DOWN
            //
        }
        else if (e.keyCode != 13) {
            //do some autcompletion magic here...
            return;
        }
        //debugger;

        var line = e.currentTarget.getValue();
        parser.parseLine(line);
        if (parser.argv.length == 0) {
            // no commmand line input
        }
        else if (parser.argQL[0]) {
            // first argument quoted -> error
            this.write("Syntax error: first argument quoted.");
        }
        else {
            var s,
                cmd = parser.argv[parser.argc++];


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
                    var opts = parser.getopt("aA");
                    if (opts.a) {
                        // discard status line on opt "a" or "A"
                        this.maxLines = this.conf.rows;
                    }
                    this.clear();
                    break;
                case "login":
                    // sample login (test for raw mode)
                    if ((parser.argc == parser.argv.length) || (parser.argv[parser.argc] == "")) {
                        this.type("usage: login <username>");
                    }
                    else {
                        this.env.getPassword = true;
                        this.env.username = this.argv[this.argc];
                        this.write("%+iSample login: repeat username as password.%-i\n");
                        this.type("password: ");
                        // exit in raw mode (blind input)
                        this.rawMode = true;
                        this.lock = false;
                        return;
                    }
                    break;
                case "open":
                case "c9":
                    parser.argv[0] = "check-isfile"
                    noderunner.socket.send(JSON.stringify({
                        command: "terminal",
                        argv: parser.argv,
                        cwd: getCwd()
                    }));
                    break;
                case "sudo":
                    s = parser.argv.join(" ").trim();
                    if (s == "sudo make me a sandwich") {
                        this.write("Okay.\n");
                        break;
                    }
                    else if (s == "sudo apt-get moo") {
                        //this.clear();
                        this.write([" ",
                            "        (__)",
                            "        (oo)",
                            "  /------\\/ ",
                            " / |    ||  ",
                            "*  /\\---/\\  ",
                            "   ~~   ~~  ",
                            "....\"Have you mooed today?\"...",
                            " "]);
                        break;
                    }
                    else {
                        this.write("E: Invalid operation " + parser.argv[parser.argc++] + "\n");
                        break;
                    }
                case "man":
                    var pages = {
                        "last": "Man, last night was AWESOME.",
                        "help": "Man, help me out here.",
                        "next": "Request confirmed; you will be reincarnated as a man next.",
                        "cat":  "You are now riding a half-man half-cat."
                    };
                    this.write((pages[parser.argv[parser.argc++]]
                        || "Oh, I'm sure you can figure it out.") + "\n");
                    break;
                case "locate":
                    var keywords = {
                        "ninja": "Ninja can not be found!",
                        "keys": "Have you checked your coat pocket?",
                        "joke": "Joke found on user.",
                        "problem": "Problem exists between keyboard and chair.",
                        "raptor": "BEHIND YOU!!!"
                    };
                    this.write((keywords[parser.argv[parser.argc++]] || "Locate what?") + "\n");
                    break;
                default:
                    var jokes = {
                        "make me a sandwich": "What? Make it yourself.",
                        "make love": "I put on my robe and wizard hat.",
                        "i read the source code": "<3",
                        //"pwd": "You are in a maze of twisty passages, all alike.",
                        "lpr": "PC LOAD LETTER",
                        "hello joshua": "How about a nice game of Global Thermonuclear War?",
                        "xyzzy": "Nothing happens.",
                        "date": "March 32nd",
                        "hello": "Why hello there!",
                        "who": "Doctor Who?",
                        "xkcd": "Yes?",
                        "su": "God mode activated. Remember, with great power comes great ... aw, screw it, go have fun.",
                        "fuck": "I have a headache.",
                        "whoami": "You are Richard Stallman.",
                        "nano": "Seriously? Why don't you just use Notepad.exe? Or MS Paint?",
                        "top": "It's up there --^",
                        "moo":"moo",
                        "ping": "There is another submarine three miles ahead, bearing 225, forty fathoms down.",
                        "find": "What do you want to find? Kitten would be nice.",
                        "more":"Oh, yes! More! More!",
                        "your gay": "Keep your hands off it!",
                        "hi":"Hi.",
                        "echo": "Echo ... echo ... echo ...",
                        "bash": "You bash your head against the wall. It's not very effective.",
                        "ssh": "ssh, this is a library.",
                        "uname": "Illudium Q-36 Explosive Space Modulator",
                        "finger": "Mmmmmm...",
                        "kill": "Terminator deployed to 1984.",
                        "use the force luke": "I believe you mean source.",
                        "use the source luke": "I'm not luke, you're luke!",
                        "serenity": "You can't take the sky from me.",
                        "enable time travel": "TARDIS error: Time Lord missing.",
                        "ed": "You are not a diety."
                    };
                    s = parser.argv.join(" ").trim();
                    if (jokes[s]) {
                        this.write(jokes[s] + "\n");
                        break;
                    }
                    else {
                        ide.dispatchEvent("consolecommand", {
                            command: "terminal",
                            argv: parser.argv,
                            parser: parser,
                            cwd: getCwd()
                        });
                        return;
                    }
            }
        }
    },

    consoleTextHandler: function(e) {
        if (e.keyCode == 9 && e.currentTarget == txtConsole) {
            txtConsole.focus();
            e.cancelBubble = true;
            return false;
        }
        else if(e.keyCode == 13 && e.ctrlKey) {
            var _self = this;
            var expression = txtCode.value;
            if (!expression.trim())
                return;

            this.log(expression, "command");
            this.evaluate(expression, function(xmlNode, body, refs, error){
                if (error)
                    _self.log(error.message, "error");
                else {
                    var type = body.type, value = body.value || body.text, ref = body.handle, className = body.className;
                    if (className == "Function") {
                        var pre = "<a class='xmlhl' href='javascript:void(0)' style='font-weight:bold;font-size:7pt;color:green' onclick='require(\"ext/console/console\").showObject(null, ["
                            + body.scriptId + ", " + body.line + ", " + body.position + ", "
                            + body.handler + ",\"" + (body.name || body.inferredName) + "\"], \""
                            + (expression || "").split(";").pop().replace(/"/g, "\\&quot;") + "\")'>";
                        var post = "</a>";
                        var name = body.name || body.inferredName || "function";
                        _self.log(name + "()", "log", pre, post);
                    }
                    else if (className == "Array") {
                        var pre = "<a class='xmlhl' href='javascript:void(0)' style='font-weight:bold;font-size:7pt;color:green' onclick='require(\"ext/console/console\").showObject(\""
                            + apf.escapeXML(xmlNode.xml.replace(/"/g, "\\\"")) + "\", "
                            + ref + ", \"" + apf.escapeXML((expression || "").trim().split(/;|\n/).pop().trim().replace(/"/g, "\\\"")) + "\")'>";
                        var post = " }</a>";

                        _self.log("Array { length: "
                            + (body.properties && body.properties.length - 1), "log", pre, post);
                    }
                    else if (type == "object") {
                        var refs = [], props = body.properties;
                        for (var i = 0, l = body.properties.length; i < l; i++) {
                            refs.push(props[i].ref);
                        }

                        var pre = "<a class='xmlhl' href='javascript:void(0)' style='font-weight:bold;font-size:7pt;color:green' onclick='require(\"ext/console/console\").showObject(\""
                            + apf.escapeXML(xmlNode.xml.replace(/"/g, "\\\"")) + "\", "
                            + ref + ", \"" + apf.escapeXML((expression || "").trim().split(/;|\n/).pop().trim().replace(/"/g, "\\\"")) + "\")'>";
                        var post = " }</a>";

                        dbg.$debugger.$debugger.lookup(refs, false, function(body) {
                            var out = [className || value, "{"];
                            for (var item, t = 0, i = 0; i < l; i++) {
                                item = body[refs[i]];
                                if (item.className == "Function" || item.className == "Object")
                                    continue;
                                if (t == 5) {
                                    out.push("more...");
                                    break;
                                }
                                var name = props[i].name || (props[i].inferredName || "Unknown").split(".").pop();
                                out.push(name + "=" + item.value, ", ");
                                t++;
                            }
                            out.pop();

                            _self.log(out.join(" "), "log", pre, post);
                        });
                    }
                    else
                        _self.log(value, "log");
                }
            });

            require("ext/settings/settings").save();
            return false;
        }
    },

    showObject : function(xmlNode, ref, expression){
        if (ref && ref.dataType == apf.ARRAY) {
            require("ext/debugger/debugger").showDebugFile(ref[0], ref[1] + 1, 0, ref[4]);
        }
        else {
            winQuickWatch.show()

            if (xmlNode && typeof xmlNode == "string")
                xmlNode = apf.getXml(xmlNode);

            var name = xmlNode && xmlNode.getAttribute("name") || expression;
            txtCurObject.setValue(name);
            dgWatch.clear("loading");

            if (xmlNode) {
                setTimeout(function(){
                    var model = dgWatch.getModel();
                    var root  = apf.getXml("<data />");
                    apf.xmldb.appendChild(root, xmlNode);
                    model.load(root);
                    //model.appendXml(xmlNode);
                }, 10);
            }
            else if (ref) {

            }
            else {
                this.evaluate(expression);
            }
        }
    },

    types : ["Object", "Number", "Boolean", "String", "Array", "Date", "RegExp", "Function", "Object"],
    domtypes : [null, "Element", "Attr", "Text", "CDataSection",
                "EntityReference", "Entity", "ProcessingInstruction", "Comment",
                "Document", "DocumentType", "DocumentFragment", "Notation"],

    calcName : function(xmlNode, useDisplay){
        var isMethod = xmlNode.tagName == "method";
        var name, loopNode = xmlNode, path = [];
        do {
            name = useDisplay
                ? loopNode.getAttribute("display") || loopNode.getAttribute("name")
                : loopNode.getAttribute("name");

            if (!name)
                break;

            path.unshift(!name.match(/^[a-z_\$][\w_\$]*$/i)
                ? (parseInt(name) == name
                    ? "[" + name + "]"
                    : "[\"" + name.replace(/'/g, "\\'") + "\"]")
                : name);
            loopNode = loopNode.parentNode;
            if (isMethod) {
                loopNode = loopNode.parentNode;
                isMethod = false;
            }
        }
        while (loopNode && loopNode.nodeType == 1);

        if (path[0].charAt(0) == "[")
            path[0] = path[0].substr(2, path[0].length - 4);
        return path.join(".").replace(/\.\[/g, "[");
    },

    /**** Init ****/

    hook : function(){
        panels.register(this);
    },

    init : function(amlNode){
        this.panel = winDbgConsole;

        //Append the console window at the bottom below the tab
        ide.vbMain.selectSingleNode("a:hbox[1]/a:vbox[2]").appendChild(winDbgConsole);

        apf.importCssString(".console_date{display:inline}");
    },

    enable : function(fromParent){
        if (!this.panel)
            panels.initPanel(this);

        if (this.manual && fromParent)
            return;

        if (!fromParent)
            this.manual = true;

        this.mnuItem.check();
        winDbgConsole.show();
    },

    disable : function(fromParent){
        if (this.manual && fromParent || !this.inited)
            return;

        if (!fromParent)
            this.manual = true;

        this.mnuItem.uncheck();
        winDbgConsole.hide();
    },

    destroy : function(){
        winDbgConsole.destroy(true, true);
        panels.unregister(this);
    }
});

});