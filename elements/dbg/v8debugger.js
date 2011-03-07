if (apf.hasRequireJS) require.def("apf/elements/dbg/v8debugger",
    ["debug/Breakpoint"],
    function(Breakpoint) {

var V8Debugger = function(dbg, host) {
    this.$init();

    this.$debugger = dbg;
    this.$host = host;

    this.$breakpoints = {};

    var _self = this;
    dbg.addEventListener("changeRunning", function(e) {
        _self.dispatchEvent("changeRunning", e);
        if (dbg.isRunning()) {
            _self.setFrame(null);
        }
    });
    dbg.addEventListener("break", function(e) {
        _self.dispatchEvent("break", e);
    });
    dbg.addEventListener("afterCompile", function(e) {
        _self.dispatchEvent("afterCompile", {script: apf.getXml(_self.$getScriptXml(e.data.script))});
    });

    this.setFrame(null);
};

(function() {
    var hasChildren = {
        "object": 8,
        "function": 4
    };

    this.stripPrefix = "";

    this.setStrip = function(stripPrefix) {
        this.stripPrefix = stripPrefix
    };

    this.$strip = function(str) {
        if (!this.stripPrefix)
            return str;

        if (str.indexOf(this.stripPrefix) == 0)
            return str.slice(this.stripPrefix.length)
        else
            return str;
    };

    this.isRunning = function() {
        return this.$debugger.isRunning();
    };

    this.scripts = function(model, callback) {
        var _self = this;
        this.$debugger.scripts(4, null, false, function(scripts) {
            var xml = [];
            for (var i = 0; i < scripts.length; i++) {
                var script = scripts[i];
                if (script.name && script.name.indexOf("chrome-extension://") == 0) {
                    continue;
                }
                xml.push(_self.$getScriptXml(script));
            }
            model.load("<sources>" + xml.join("") + "</sources>");
            callback();
        });
    };

    this.$getScriptXml = function(script) {
        return ["<file scriptid='", script.id,
            "' scriptname='", apf.escapeXML(script.name || "anonymous"),
            "' text='", this.$strip(apf.escapeXML(script.text || "anonymous")),
            "' lineoffset='", script.lineOffset,
            "' debug='true' />"].join("")
    };

    function getId(frame){
        return (frame.func.name || frame.func.inferredName || (frame.line + frame.position));
    }

    this.$isEqual = function(xmlFrameSet, frameSet){
        if (xmlFrameSet.length != frameSet.length)
            return false;

        var xmlFirst = xmlFrameSet[0];
        var first    = frameSet[0];
        if (xmlFirst.getAttribute("scriptid") != first.func.scriptId)
            return false;
        if (xmlFirst.getAttribute("id") != getId(first))
            return false;
        //if (xmlFirst.selectNodes("vars/item").length != (1 + first.arguments.length + first.locals.length))
            //return false;

        //@todo check for ref?? might fail for 2 functions in the same file with the same name in a different context
        return true;
    }

    /**
     * Assumptions:
     *  - .index stays the same
     *  - sequence in the array stays the same
     *  - ref stays the same when stepping in the same context
     */
    this.$updateFrame = function(xmlFrame, frame){
        //With code insertion, line/column might change??
        xmlFrame.setAttribute("line", frame.line);
        xmlFrame.setAttribute("column", frame.column);

        var vars = xmlFrame.selectNodes("vars/item");
        var fVars = frame.arguments;
        for (var i = 1, j = 0; j < fVars.length; j++) { //i = 1 to skin this
            if (fVars[j].name)
                this.$updateVar(vars[i++], fVars[j]);
        }
        var fVars = frame.locals;
        for (var j = 0; j < frame.locals.length; j++) {
            if (fVars[j].name !== ".arguments")
                this.$updateVar(vars[i++], fVars[j]);
        }

        //@todo not caring about globals/scopes right now
    },

    this.$updateVar = function(xmlVar, fVar){
        xmlVar.setAttribute("value", this.$valueString(fVar.value));
        xmlVar.setAttribute("type", fVar.value.type);
        xmlVar.setAttribute("ref", fVar.value.ref);
        apf.xmldb.setAttribute(xmlVar, "children", hasChildren[fVar.value.type] ? "true" : "false");
    }

    this.$buildFrame = function(frame, ref, xml){
        var script = ref(frame.script.ref);
        xml.push("<frame index='", frame.index,
            "' name='", apf.escapeXML(apf.escapeXML(this.$frameToString(frame))),
            "' column='", frame.column,
            "' id='", getId(frame),
            "' ref='", frame.ref,
            "' line='", frame.line,
            "' script='", this.$strip(script.name),
            "' scriptid='", frame.func.scriptId, //script.id,
            "'>");
        xml.push("<vars>");

        var receiver = {
            name: "this",
            value: frame.receiver
        };
        xml.push(this.$serializeVariable(receiver));

        for (var j = 0; j < frame.arguments.length; j++) {
            if (frame.arguments[j].name)
                xml.push(this.$serializeVariable(frame.arguments[j]));
        }
        for (var j = 0; j < frame.locals.length; j++) {
            if (frame.locals[j].name !== ".arguments")
                xml.push(this.$serializeVariable(frame.locals[j]));
        }
        xml.push("<globals />");
        xml.push("</vars>");

        xml.push("<scopes>");
        var scopes = frame.scopes;
        for (var j = 0; j < scopes.length; j++) {
            var scope = scopes[j];
            xml.push("<scope index='",scope.index, "' type='", scope.type, "' />");
        }
        xml.push("</scopes>");

        xml.push("</frame>");
    }

    this.backtrace = function(model, callback) {
        var _self = this;
        this.$debugger.backtrace(null, null, null, true, function(body, refs) {
            function ref(id) {
                for (var i=0; i<refs.length; i++) {
                    if (refs[i].handle == id) {
                        return refs[i];
                    }
                }
                return {};
            }

            var frames    = body.frames;        
            var xmlFrames = model.queryNodes("frame");
            if (xmlFrames.length && _self.$isEqual(xmlFrames, frames)) {
                for (var i = 0; i < frames.length; i++) {
                    _self.$updateFrame(xmlFrames[i], frames[i]);
                }
                _self.setFrame(xmlFrames[0]);
            }
            else {
                var xml = [];
                if (frames) {
                    for (var i = 0; i < frames.length; i++) {
                        _self.$buildFrame(frames[i], ref, xml);
                    }
                }
                model.load("<frames>" + xml.join("") + "</frames>");
                _self.setFrame(model.data.firstChild);
            }
            callback();
        });
    };

    this.loadScript = function(script, callback) {
        var id = script.getAttribute("scriptid");
        var _self = this;
        this.$debugger.scripts(4, [id], true, function(scripts) {
            if (scripts.length) {
                var script = scripts[0];
                callback(script.source);
            }
        });
    };

    this.loadObjects = function(item, callback) {
        var ref = item.getAttribute("ref");
        var _self = this;
        this.$debugger.lookup([ref], false, function(body) {
            var refs = [];
            var props = body[ref].properties;
            for (var i=0; i<props.length; i++) {
                refs.push(props[i].ref);
            }

            _self.$debugger.lookup(refs, false, function(body) {
                var xml = ["<item>"];
                for (var i=0; i<props.length; i++) {
                    props[i].value = body[props[i].ref];
                    xml.push(_self.$serializeVariable(props[i]));
                }
                xml.push("</item>");
                callback(xml.join(""));
            });
        });
    };

    this.loadFrame = function(frame, callback) {
        //var xml = "<vars><item name='juhu' value='42' type='number'/></vars>"
        var scopes = frame.getElementsByTagName("scope");

        var frameIndex = parseInt(frame.getAttribute("index"));

        var _self = this;
        var processed = 0;
        var expected = 0;
        var xml = ["<vars>"];

        for (var i=0; i<scopes.length; i++) {
            var scope = scopes[i];
            var type = parseInt(scope.getAttribute("type"));

            // ignore local and global scope
            if (type > 1) {
                expected += 1;
                var index = parseInt(scope.getAttribute("index"));
                this.$debugger.scope(index, frameIndex, true, function(body) {
                    var props = body.object.properties;
                    for (j=0; j<props.length; j++) {
                        xml.push(_self.$serializeVariable(props[j]))
                    }
                    processed += 1;
                    if (processed == expected) {
                        xml.push("</vars>");
                        callback(xml.join(""));
                    }
                });
            }
        }
        if (expected == 0)
            return callback("<vars />");
    };

    this.setFrame = function(frame) {
        this.$activeFrame = frame;
        this.dispatchEvent("changeFrame", {data: frame});
    };


    this.getActiveFrame = function() {
        return this.$activeFrame;
    };

    this.setBreakpoints = function(model, callback) {
        var _self = this;

        var breakpoints = model.queryNodes("breakpoint");
        _self.$debugger.listbreakpoints(function(v8Breakpoints) {
            if (v8Breakpoints.breakpoints) {
                for (var id in _self.$breakpoints)
                    _self.$breakpoints[id].destroy();
                _self.$breakpoints = {};
                
                for (var i=0,l=v8Breakpoints.breakpoints.length; i<l; i++) {
                    if (v8Breakpoints.breakpoints[i].type == "scriptId")
                        continue;
                        
                    var breakpoint = Breakpoint.fromJson(v8Breakpoints.breakpoints[i], _self.$debugger);
                    var id = breakpoint.source + "|" + breakpoint.line;
                    
                    _self.$breakpoints[id] = breakpoint;
                    
                    model.removeXml("breakpoint[@script='" + breakpoint.source + "' and @line='" + breakpoint.line + "']");
                    model.appendXml(_self.$getBreakpointXml(breakpoint, 0));
                }
            }
    
            var modelBps = model.queryNodes("breakpoint") || [];
            
            apf.asyncForEach(Array.prototype.slice.call(modelBps, 0), function(modelBp, next) {
                var script = modelBp.getAttribute("script");
                var line = modelBp.getAttribute("line");
                var id = script + "|" + line;
                var bp = _self.$breakpoints[id];
                if (!bp) {
                    bp = _self.$breakpoints[id] = new Breakpoint(script, line, modelBp.getAttribute("column"));
                    bp.condition = modelBp.getAttribute("condition");
                    bp.ignoreCount = parseInt(modelBp.getAttribute("ignorecount") || 0);
                    bp.enabled = modelBp.getAttribute("enabled") == "true";
                    bp.attach(_self.$debugger, function() {
		                if (modelBp.parentNode) model.removeXml(modelBp);
		                model.appendXml(_self.$getBreakpointXml(bp, 0));
		                next();
                    });
                }
                else {
	                if (modelBp.parentNode) model.removeXml(modelBp);
	                model.appendXml(_self.$getBreakpointXml(bp, 0));
	                next();
                }
            }, callback);
        });
    };
    
    this.toggleBreakpoint = function(script, relativeRow, model) {
        var _self = this;

        var name = script.getAttribute("scriptname");

        var lineOffset = parseInt(script.getAttribute("lineoffset") || "0");
        var row = lineOffset + relativeRow;
        var id = name + "|" + row;

        var breakpoint = this.$breakpoints[id];
        if (breakpoint) {
            delete this.$breakpoints[id];
            breakpoint.clear(function() {
                model.removeXml(model.queryNode("breakpoint[@id=" + breakpoint.$id + "]"));
            });
        } else {
            breakpoint = this.$breakpoints[id] = new Breakpoint(name, row);
            breakpoint.attach(this.$debugger, function() {
                model.appendXml(_self.$getBreakpointXml(breakpoint, lineOffset, script.getAttribute("scriptid")));
            });
        }
    };
    
    this.$getBreakpointXml = function(breakpoint, lineOffset, scriptId) {
        var xml = [];
        xml.push("<breakpoint",
            " id='", breakpoint.$id,
            "' text='", this.$strip(apf.escapeXML(breakpoint.source)), ":", breakpoint.line,
            "' script='", apf.escapeXML(breakpoint.source),
            scriptId ? "' scriptid='" + scriptId : "",
            "' lineoffset='", lineOffset || 0,
            "' line='", breakpoint.line,
            "' condition='", apf.escapeXML(breakpoint.condition || ""),
            "' ignorecount='", breakpoint.ignoreCount || 0,
            "' enabled='", breakpoint.enabled,
            "' />")

        return(xml.join(""));
    };

    this.continueScript = function(callback) {
        this.$debugger.continueScript(null, null, callback);
    };

    this.stepInto = function(callback) {
        this.$debugger.continueScript("in", 1, callback);
    };

    this.stepNext = function(callback) {
        this.$debugger.continueScript("next", 1, callback);
    };

    this.stepOut = function(callback) {
        this.$debugger.continueScript("out", 1, callback);
    };

    this.suspend = function() {
        this.$debugger.suspend();
    };
  
    this.changeLive = function(scriptId, newSource, previewOnly, callback) {
        this.$debugger.changelive(scriptId, newSource, previewOnly, callback);
    };
    
    this.evaluate = function(expression, frame, global, disableBreak, callback){
        this.$debugger.evaluate(expression, frame, global, disableBreak, function(body, refs, error){
            var str = [];
            var name = expression.trim().split(/;|\n/).pop().trim().replace(/"/g, "&quot;");
            if (error) {
                str.push("<item type='.error' name=\"", apf.escapeXML(name),
                    "\" value='", error.message, "' />");
            }
            else {
                str.push("<item name=\"", apf.escapeXML(name),
                  "\" value='", apf.escapeXML(body.text), //body.value ||
                  "' type='", body.type,
                  "' ref='", body.handle,
                  body.constructorFunction ? "' constructor='" + body.constructorFunction.ref : "",
                  body.prototypeObject ? "' prototype='" + body.prototypeObject.ref : "",
                  body.properties && body.properties.length ? "' children='true" : "",
                  "' />");
            }
            callback(apf.getXml(str.join("")), body, refs, error);
        });
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
        str.push(frame.func.name || frame.func.inferredName || "anonymous", "(");
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
        str.push("<item name='", apf.escapeXML(name || item.name),
            "' value='", apf.escapeXML(this.$valueString(item.value)),
            "' type='", item.value.type,
            "' ref='", typeof item.value.ref == "number" ? item.value.ref : item.value.handle,
            hasChildren[item.value.type] ? "' children='true" : "",
            "' />");
        return str.join("");
    }
    
}).call(V8Debugger.prototype = new apf.Class());

return V8Debugger;

});