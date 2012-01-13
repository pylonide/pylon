/**
 * Live object inspection for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

exports.evaluate = function(expression, callback){
    var frame = (self.dgStack && dgStack.selected && dgStack.selected.getAttribute("ref")) || null;
    dbg.main.evaluate(expression, frame, null, null, callback || exports.showObject);
};

exports.checkChange = function(xmlNode) {
    if (xmlNode.tagName == "method" || "Boolean|String|undefined|null|Number".indexOf(xmlNode.getAttribute("type")) == -1)
        return false;
};

var MESSAGE_TYPES = {
    "prompt" : '<span class="prompt">&gt; __MSG__</span>',
    "error" : '<span class="error">__MSG__</span>',
    "log" : '__MSG__'
};

var numOutputSection = 0;
function logToInspectorOutput(output, type, pre, post, existingDiv) {
    var outStr = MESSAGE_TYPES[type];
    outStr = outStr.replace("__MSG__", apf.escapeXML(output));

    if (!existingDiv) {
        numOutputSection++;
        pre = '<div class="output_section" id="output_section' + numOutputSection + '">' +
            (pre || "");
    }
    pre = (pre || "");
    post = (post || "");

    if (!existingDiv)
        post += '</div>';

    outStr = pre + outStr + post;

    if (existingDiv) {
        var outElement = document.getElementById(existingDiv);
        if (outElement)
            outElement.innerHTML = outElement.innerHTML + '<br />' + outStr;
    }
    else {
        txtInteractiveOutput.addValue(outStr);
    }

    if (!existingDiv)
        return  "output_section" + numOutputSection;
}

exports.applyChange = function(xmlNode){
    var value = xmlNode.getAttribute("value");
    var name = exports.calcName(xmlNode);
    try {
        if (name.indexOf(".") > -1) {
            var prop;
            var obj = self.parent.eval(name.replace(/\.([^\.\s]+)$/, ""));
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

    var expression = txtCode.getValue().trim();
    if (!expression)
        return;

    var existingDiv = logToInspectorOutput(expression, "prompt");

    this.evaluate(expression, function(xmlNode, body, refs, error){
        if (error) {
            logToInspectorOutput(error.message, "error", null, null, existingDiv);
        }
        else {
            var type      = body.type,
                value     = body.value || body.text,
                ref       = body.handle,
                className = body.className;

            if (className == "Function") {
                var pre = "<a class='xmlhl' href='javascript:void(0)' onclick='require(\"ext/debugger/inspector\").showObject(null, ["
                    + body.scriptId + ", " + body.line + ", " + body.position + ", "
                    + body.handle + ",\"" + (body.name || body.inferredName) + "\"], \""
                    + (expression || "").split(";").pop().replace(/"/g, "\\&quot;") + "\")'>";
                var post = "</a>";
                var name = body.name || body.inferredName || "function";
                logToInspectorOutput(name + "()", "log", pre, post, existingDiv);
            }
            else if (className == "Array") {
                var pre = "<a class='xmlhl' href='javascript:void(0)' style='' onclick='require(\"ext/debugger/inspector\").showObject(\""
                    + apf.escapeXML(xmlNode.xml.replace(/"/g, "\\\"")) + "\", "
                    + ref + ", \"" + apf.escapeXML((expression || "").trim().split(/;|\n/).pop().trim().replace(/"/g, "\\\"")) + "\")'>";
                var post = " }</a>";


                logToInspectorOutput("Array { length: "
                    + (body.properties && body.properties.length - 1), "log", pre, post, existingDiv);
            }
            else if (type == "object") {
                var refs = [], props = body.properties;
                for (var i = 0, l = body.properties.length; i < l; i++)
                    refs.push(props[i].ref);

                var pre = "<a class='xmlhl' href='javascript:void(0)' onclick='require(\"ext/debugger/inspector\").showObject(\""
                    // replace angle brackets by unicode equivalents because apf doesn't accept angle brackets in attribute values
                    + apf.escapeXML(xmlNode.xml.replace(/"/g, "\\\"").replace(/&lt;/g, "\u3008").replace(/&gt;/, "\u3009")) + "\", "
                    + ref + ", \"" + apf.escapeXML((expression || "").trim().split(/;|\n/).pop().trim().replace(/"/g, "\\\"")) + "\")'>";
                var post = " }</a>";

                dbg.main.lookup(refs, false, function(body) {
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

                    logToInspectorOutput(out.join(" "), "log", pre, post, existingDiv);
                });
            }
            else
                logToInspectorOutput(value, "log", null, null, existingDiv);
        }
    });

    require("ext/settings/settings").save();
    return false;
};

exports.showObject = function(xmlNode, ref, expression) {
    if (ref && ref.dataType == apf.ARRAY) {
        dbg.sources.showDebugFile(ref[0], ref[1], 0, ref[4]);
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

        var xmlDecode = function (input) {
            var e = document.createElement('div');
            e.innerHTML = input;
            return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
        }

        name = xmlDecode(name);

        path.unshift(!name.match(/^[a-z_\$][\w_\$]*$/i)
            ? (parseInt(name, 10) == name
                ? "[" + name + "]"
                : "[\"" + name + "\"]")
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

/**
 * Given an xmlNode determines whether this item can be edited in realtime
 */
exports.isEditable = function(xmlNode) {
    if (!xmlNode) return false;

    var type = xmlNode.getAttribute("type");

    // we can edit these types
    switch (type) {
        case "string":
        case "null":
        case "number":
        case "boolean":
            break;
        default:
            return false;
    }

    // V8 debugger cannot change variables that are locally scoped, so we need at least
    // one parent property.
    if (exports.calcName(xmlNode, true).indexOf(".") === -1) {
        return false;
    }

    // ok, move along
    return true;
};

/**
 * Determines whether a new value is valid to pass into an attribute
 */
exports.validateNewValue = function(xmlNode, value) {
    var type = xmlNode.getAttribute("type");
    var validator;

    switch (type) {
        case "string":
        case "null":
            validator = /(.*|^$)/;
            break;
        case "number":
            validator = /^\d+(\.\d+)?$/;
            break;
        case "boolean":
            validator = /^(true|false)$/;
            break;
        default:
            return false; // other types cannot be edited
    }

    return validator.test(value);
};

/**
 * Updates the value of a property to a new value
 */
exports.setNewValue = function(xmlNode, value, callback) {
    // find the prop plus its ancestors
    var expression = exports.calcName(xmlNode, true);

    // build an instruction for the compiler
    var instruction;
    switch (xmlNode.getAttribute("type")) {
        case "string":
        case "null":
            // escape strings
            instruction = expression + " = \"" + value.replace(/"/g, "\\\"") + "\"";
            break;
        default:
            instruction = expression + " = " + value;
            break;
    }

    // dispatch it to the debugger
    exports.evaluate(instruction, callback);
};

});
