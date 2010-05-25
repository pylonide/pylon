apf.ChromeDebugger = function(dbg, host) {
    this.$init();
    
    this.$debugger = dbg;
    this.$host = host;
    
    this.$breakpoints = {};
};

(function() {

    this.isRunning = function() {
        return this.$debugger.isRunning();
    };
    
    this.scripts = function(model, callback) {
        var self = this;
        this.$debugger.scripts(4, null, false, function(scripts) {
            var xml = [];
            for (var i = 0; i < scripts.length; i++) {
                var script = scripts[i];
                if (script.name && script.name.indexOf("chrome-extension://") == 0) {
                    continue;
                }
                xml.push("<file id='", script.id,
                    "' name='", apf.escapeXML(script.name || "anonymous"),
                    "' text='", apf.escapeXML(script.text || "anonymous"),
                    "' lineoffset='", script.lineOffset,
                    "' debug='true' />");
            }
            model.load("<sources>" + xml.join("") + "</sources>");
        });
    };
    
    this.loadScript = function(script, callback) {
        var id = script.getAttribute("id");
        var self = this;
        this.$debugger.scripts(4, [id], true, function(scripts) {
            if (scripts.length) {
                var script = scripts[0];
                callback(script.source);
            }
        });
    };

    this.loadObjects = function(item, callback) {
        var ref = item.getAttribute("ref");
        var self = this;
        this.$debugger.lookup([ref], false, function(body) {
            var refs = [];
            var props = body[ref].properties;
            for (var i=0; i<props.length; i++) {
                refs.push(props[i].ref);
            }

            self.$debugger.lookup(refs, false, function(body) {
                var xml = ["<item>"];
                for (var i=0; i<props.length; i++) {
                    props[i].value = body[props[i].ref];
                    xml.push(self.serializeVariable(props[i]));
                }
                xml.push("</item>");
                callback(xml.join(""));
            });
        });
    };
    
    this.toggleBreakpoint = function(script, relativeRow, model) {
        var self = this;

        var scriptId = script.getAttribute("id");

        var lineOffset = parseInt(script.getAttribute("lineoffset"));
        var row = lineOffset + relativeRow;
        var id = scriptId + "|" + row;

        var breakpoint = this.$breakpoints[id];
        if (breakpoint) {
            delete this.$breakpoints[id];
            breakpoint.clear(function() {
                model.removeXml(model.queryNode("breakpoint[@id=" + breakpoint.$id + "]"));
            });
        } else {
            var name = script.getAttribute("name");
            breakpoint = this.$breakpoints[id] = new Breakpoint(name, row);
            breakpoint.attach(this.$debugger, function() {
                var xml = [];
                xml.push("<breakpoint",
                    " id='", breakpoint.$id,
                    "' text='", apf.escapeXML(name), ":", breakpoint.line,
                    "' script='", apf.escapeXML(name),
                    "' scriptid='", scriptId,
                    "' lineoffset='", lineOffset,
                    "' line='", breakpoint.line,
                    "' condition='", apf.escapeXML(breakpoint.condition || ""),
                    "' ignorecount='", breakpoint.ignoreCount || 0,
                    "' enabled='", breakpoint.enabled,
                    "' />")

                model.appendXml(xml.join(""));
            });
        }
    };
    
    this.$valueString = function(value) {
        switch (value.type) {
            case "undefined":
            case "null":
                return value.type;

            case "boolean":
            case "number":
            case "string":
                return value.value + "";

            case "object":
                return "[" + value.className + "]";

            case "function":
                return "function " + value.inferredName + "()";

            default:
                return value.type;
        };
    };

    this.$frameToString = function(frame) {
        var str = [];
        str.push(
            //"<", valueString(frame.receiver), ">.",
            frame.func.name || frame.func.inferredName, "("
        );
        var args = frame.arguments;
        var argsStr = [];
        for (var i=0; i<args.length; i++) {
            var arg = args[i];
            if (!arg.name)
                continue;
            argsStr.push(arg.name);
        }
        str.push(argsStr.join(", "), ")");
        return str.join("");
    }

    this.$serializeVariable = function(item, name) {
        var str = [];
        var hasChildren = {
            "object": 8,
            "function": 4
        };
        str.push("<item name='", apf.escapeXML(name || item.name),
            "' value='", apf.escapeXML(this.valueString(item.value)),
            "' type='", item.value.type,
            "' ref='", item.value.ref || item.value.handle,
            hasChildren[item.value.type] ? "' children='true" : "",
            "' />");
        return str.join("");
    }        
    
}).call(apf.ChromeDebugger.prototype = new apf.Class());