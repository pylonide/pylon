/**
 * Live object inspection for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var Console = require("ext/console/console");
var Logger  = require("ext/console/logger");

exports.evaluate = function(expression, callback){
    var _self = this;
    var frame = (self.dgStack && dgStack.selected && dgStack.selected.getAttribute("ref")) || null;
    
    dbg.evaluate(expression, frame, null, null, callback || function(xmlNode){
        exports.showObject(xmlNode);
    });
};

exports.checkChange = function(xmlNode){
    var value = xmlNode.getAttribute("value");
    if (xmlNode.tagName == "method" || "Boolean|String|undefined|null|Number".indexOf(xmlNode.getAttribute("type")) == -1)
        return false;
};

exports.applyChange = function(xmlNode){
    var value = xmlNode.getAttribute("value");
    var name = exports.calcName(xmlNode);
    try {
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
};

exports.consoleTextHandler = function(e) {
    if (!(e.keyCode == 13 && e.ctrlKey))
        return;

    var _self = this;
    
    var expression = txtCode.getValue().trim();
    if (!expression)
        return;
    
    Console.showOutput();
    Logger.log(expression, "command", null, null, txtOutput);
    
    this.evaluate(expression, function(xmlNode, body, refs, error){
        if (error) {
            Logger.log(error.message, "error");
        }
        else {
            var type      = body.type,
                value     = body.value || body.text,
                ref       = body.handle,
                className = body.className;

            if (className == "Function") {
                var pre = "<a class='xmlhl' href='javascript:void(0)' style='font-weight:bold;font-size:7pt;color:green' onclick='require(\"ext/console/console\").showObject(null, ["
                    + body.scriptId + ", " + body.line + ", " + body.position + ", "
                    + body.handle + ",\"" + (body.name || body.inferredName) + "\"], \""
                    + (expression || "").split(";").pop().replace(/"/g, "\\&quot;") + "\")'>";
                var post = "</a>";
                var name = body.name || body.inferredName || "function";
                Logger.log(name + "()", "log", pre, post, txtOutput);
            }
            else if (className == "Array") {
                var pre = "<a class='xmlhl' href='javascript:void(0)' style='font-weight:bold;font-size:7pt;color:green' onclick='require(\"ext/console/console\").showObject(\""
                    + apf.escapeXML(xmlNode.xml.replace(/"/g, "\\\"")) + "\", "
                    + ref + ", \"" + apf.escapeXML((expression || "").trim().split(/;|\n/).pop().trim().replace(/"/g, "\\\"")) + "\")'>";
                var post = " }</a>";

                Logger.log("Array { length: "
                    + (body.properties && body.properties.length - 1), "log", pre, post, txtOutput);
            }
            else if (type == "object") {
                var refs = [], props = body.properties;
                for (var i = 0, l = body.properties.length; i < l; i++)
                    refs.push(props[i].ref);

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
                    if (t) out.pop();

                    Logger.log(out.join(" "), "log", pre, post, txtOutput);
                });
            }
            else
                Logger.log(value, "log", null, null, txtOutput);
        }
    });

    require("ext/settings/settings").save();
    return false;
};

exports.showObject = function(xmlNode, ref, expression) {
    if (ref && ref.dataType == apf.ARRAY) {
        require(["ext/debugger/debugger"], function(dbg) {
            dbg.showDebugFile(ref[0], ref[1] + 1, 0, ref[4]);
        });
    }
    else {
        require(["ext/quickwatch/quickwatch"], function(quickwatch) {
            quickwatch.toggleDialog(1);
            
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
                exports.evaluate(expression);
            }
        });

    }
};

var types    = ["Object", "Number", "Boolean", "String", "Array", "Date", "RegExp", "Function", "Object"];
var domtypes = [
    null, "Element", "Attr", "Text", "CDataSection",
    "EntityReference", "Entity", "ProcessingInstruction", "Comment",
    "Document", "DocumentType", "DocumentFragment", "Notation"
];

exports.calcName = function(xmlNode, useDisplay){
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

    if (!path[0])
        return "";
    else if (path[0].charAt(0) == "[")
        path[0] = path[0].substr(2, path[0].length - 4);
    
    return path.join(".").replace(/\.\[/g, "[");
};

});
