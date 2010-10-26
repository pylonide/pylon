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
     "text!ext/console/console.xml"],
    function(ide, ext, lang, panels, markup) {

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
            tabConsole.set(1);

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

        lstScripts.addEventListener("afterselect", function(e) {
            e.selected && require("ext/debugger/debugger").showDebugFile(e.selected.getAttribute("scriptid"));
        });

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