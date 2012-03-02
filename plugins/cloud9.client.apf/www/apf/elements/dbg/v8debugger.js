// #ifdef __AMLDEBUGGER || __INC_ALL
if (apf.hasRequireJS) define("apf/elements/dbg/v8debugger",
    ["module", "debug/Breakpoint"],
    function(module, Breakpoint) {

var V8Debugger = module.exports = function(dbg, host) {
    this.$init();

    this.$debugger = dbg;
    this.$host = host;
    this.$v8breakpoints = {};

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
        this.stripPrefix = stripPrefix;
    };

    this.$strip = function(str) {
        if (!this.stripPrefix)
            return str;

        return str.indexOf(this.stripPrefix) === 0
            ? str.slice(this.stripPrefix.length)
            : str;
    };

    this.isRunning = function() {
        return this.$debugger.isRunning();
    };

    this.scripts = function(model, callback) {
        var _self = this;
        this.$debugger.scripts(4, null, false, function(scripts) {
            var xml = [];
            for (var i = 0, l = scripts.length; i < l; i++) {
                var script = scripts[i];
                if (script.name && script.name.indexOf("chrome-extension://") === 0)
                    continue;
                xml.push(_self.$getScriptXml(script));
            }
            model.load("<sources>" + xml.join("") + "</sources>");
            callback();
        });
    };

    this.$getScriptXml = function(script) {
        return [
            "<file scriptid='", script.id,
            "' scriptname='", apf.escapeXML(script.name || "anonymous"),
            "' text='", this.$strip(apf.escapeXML(script.text || "anonymous")),
            "' lineoffset='", script.lineOffset,
            "' debug='true' />"
        ].join("");
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
    };

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

        var i, j, l;
        var vars  = xmlFrame.selectNodes("vars/item");
        var fVars = frame.arguments;
        for (i = 1, j = 0, l = fVars.length; j < l; j++) { //i = 1 to skin this
            if (fVars[j].name)
                this.$updateVar(vars[i++], fVars[j]);
        }
        fVars = frame.locals;
        for (j = 0, l = frame.locals.length; j < l; j++) {
            if (fVars[j].name !== ".arguments")
                this.$updateVar(vars[i++], fVars[j]);
        }

        //@todo not caring about globals/scopes right now
    };

    this.$updateVar = function(xmlVar, fVar){
        xmlVar.setAttribute("value", this.$valueString(fVar.value));
        xmlVar.setAttribute("type", fVar.value.type);
        xmlVar.setAttribute("ref", fVar.value.ref);
        apf.xmldb.setAttribute(xmlVar, "children", hasChildren[fVar.value.type] ? "true" : "false");
    };

    this.$buildFrame = function(frame, ref, xml){
        var script = ref(frame.script.ref);
        xml.push(
            "<frame index='", frame.index,
            "' name='", apf.escapeXML(apf.escapeXML(this.$frameToString(frame))),
            "' column='", frame.column,
            "' id='", getId(frame),
            "' ref='", frame.ref,
            "' line='", frame.line,
            "' script='", this.$strip(script.name),
            "' scriptid='", frame.func.scriptId, //script.id,
            "'>"
        );
        xml.push("<vars>");

        var receiver = {
            name: "this",
            value: frame.receiver
        };
        xml.push(this.$serializeVariable(receiver));

        var j, l;
        for (j = 0, l = frame.arguments.length; j < l; j++) {
            if (frame.arguments[j].name)
                xml.push(this.$serializeVariable(frame.arguments[j]));
        }
        for (j = 0, l = frame.locals.length; j < l; j++) {
            if (frame.locals[j].name !== ".arguments")
                xml.push(this.$serializeVariable(frame.locals[j]));
        }
        xml.push("<globals />");
        xml.push("</vars>");

        xml.push("<scopes>");
        var scopes = frame.scopes;
        for (j = 0, l = scopes.length; j < l; j++) {
            var scope = scopes[j];
            xml.push("<scope index='",scope.index, "' type='", scope.type, "' />");
        }
        xml.push("</scopes>");

        xml.push("</frame>");
    };

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

            var i, l;
            var frames    = body.frames;        
            var xmlFrames = model.queryNodes("frame");
            if (xmlFrames.length && _self.$isEqual(xmlFrames, frames)) {
                for (i = 0, l = frames.length; i < l; i++)
                    _self.$updateFrame(xmlFrames[i], frames[i]);
                _self.setFrame(xmlFrames[0]);
            }
            else {
                var xml = [];
                if (frames) {
                    for (i = 0, l = frames.length; i < l; i++)
                        _self.$buildFrame(frames[i], ref, xml);
                }
                model.load("<frames>" + xml.join("") + "</frames>");
                _self.setFrame(model.data.firstChild);
            }
            callback();
        });
    };

    this.loadScript = function(script, callback) {
        var id    = script.getAttribute("scriptid");
        var _self = this;
        this.$debugger.scripts(4, [id], true, function(scripts) {
            if (!scripts.length)
                return;
            var script = scripts[0];
            callback(script.source);
        });
    };

    this.loadObjects = function(item, callback) {
        var ref   = item.getAttribute("ref");
        var _self = this;
        this.$debugger.lookup([ref], false, function(body) {
            var refs  = [];
            var props = body[ref].properties;
            for (var i = 0, l = props.length; i < l; i++)
                refs.push(props[i].ref);

            _self.$debugger.lookup(refs, false, function(body) {
                var xml = ["<item>"];
                for (var i = 0, l = props.length; i < l; i++) {
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

        var frameIndex = parseInt(frame.getAttribute("index"), 10);

        var _self     = this;
        var processed = 0;
        var expected  = 0;
        var xml       = ["<vars>"];

        for (var i = 0, l = scopes.length; i < l; i++) {
            var scope = scopes[i];
            var type = parseInt(scope.getAttribute("type"), 10);

            // ignore local and global scope
            if (type > 1) {
                expected += 1;
                var index = parseInt(scope.getAttribute("index"), 10);
                this.$debugger.scope(index, frameIndex, true, function(body) {
                    var props = body.object.properties;
                    for (j = 0, l2 = props.length; j < l2; j++)
                        xml.push(_self.$serializeVariable(props[j]));
                    processed += 1;
                    if (processed == expected) {
                        xml.push("</vars>");
                        callback(xml.join(""));
                    }
                });
            }
        }
        if (expected === 0)
            return callback("<vars />");
    };

    this.setFrame = function(frame) {
        this.$activeFrame = frame;
        this.dispatchEvent("changeFrame", {data: frame});
    };


    this.getActiveFrame = function() {
        return this.$activeFrame;
    };

    /**
     * Initialization function that sets the breakpoints right after attaching to the debugger
     */
    this.setBreakpoints = function(model, callback) {
        var _self = this;
        
        // so read all the breakpoints, then call the debugger to actually set them
        var allBreakpoints = model.queryNodes("breakpoint");
        allBreakpoints.forEach(function(bp) {
            var script = bp.getAttribute("script");
            var line = bp.getAttribute("line");
            var col = bp.getAttribute("column");
            
            // construct a nice 'Breakpoint' object
            var v8bp = new Breakpoint(script, line, col);
            // attach it to the debugger
            v8bp.attach(_self.$debugger, function () {
                _self.$bindV8BreakpointToModel(bp, v8bp);
                
                handleAdded();
            });
        });
        
        // keep track of all breakpoints and check if they're really added
        var counter = 0;
        function handleAdded() {
            if (++counter === allBreakpoints.length) {
                callback();
            }
        }
        
        if (!allBreakpoints.length) {
            callback();
        }
    };
    
    /**
     * Used from the UI to enable or disable a breakpoint
     */
    this.toggleBreakpoint = function(script, relativeRow, model) {
        var _self      = this;
        
        // grab some basic info from the 'script' attribute
        var name       = script.getAttribute("scriptname");
        var lineOffset = parseInt(script.getAttribute("lineoffset") || "0", 10);
        var row        = lineOffset + relativeRow;
        
        // query to see if we already have breakpoints on this script + line
        var breakpoints = model.data.selectNodes("//breakpoint[@script=\'" + name + "\' and @line=" + row + "]");
        
        // if there are breakpoints already, remove them
        if (breakpoints.length) {
            breakpoints.forEach(function (bp) {
                var removeHandled = false;
                
                try {
                    // callback to the V8 debugger
                    _self.$getV8BreakpointFromModel(bp).clear(function() {
                        // and remove it from the UI
                        _self.$removeBreakpoint(bp, model);
                    });
                    removeHandled = true;
                }
                // if it fails? then remove from the UI anyways
                catch (ex) {
                    removeHandled = false;
                }
                
                // no debugger handling this via a callback, then well do it ourselves
                if (!removeHandled) {
                    _self.$removeBreakpoint(bp, model);
                }
            });
        }
        else {
            this.$addBreakpoint({
                name: name,
                row: row,
                col: 0,
                lineOffset: lineOffset,
                scriptId: script.getAttribute("scriptid")
            }, model);
        }
    };
    
    /**
     * Remove a breakpoint
     */
    this.$removeBreakpoint = function(bp, model) {
        // removing a certain breakpoint from the model
        var xpath;
        
        // check if we have some identifier
        if (bp.$id) {
            xpath = "breakpoint[@id=" + bp.$id + "]";
        }
        else {
            xpath = "//breakpoint[@script=\'" + bp.getAttribute("script") + "\' and @line=" + bp.getAttribute("line") + "]";
        }
        
        // remove all nodes
        var node;
        
        while (node = model.queryNode(xpath)) {
            apf.xmldb.removeNode(node);
        }
    };
    
    /**
     * Adds a new breakpoint
     */
    this.$addBreakpoint = function(options, model, callback) {
        var _self = this;
        
        // create 
        var v8bp = new Breakpoint(options.name, options.row, options.col, options.dbg);

        // no clue what this does
        if (options.data) {
            apf.extend(v8bp, options.data);
        }
        
        // now attach it
        v8bp.attach(this.$debugger, function () {
            // after succeeding, also add it to the the model
            model.appendXml(_self.$getBreakpointXml(v8bp, options.lineOffset, options.scriptId));
            
            // bind model and breakpoint to eachother
            _self.$bindV8BreakpointToModel(model.data.selectSingleNode("//breakpoint[@script=\'" + v8bp.source + "\' and @line=" + options.row + "]"), v8bp);
            
            if (typeof callback === "function") {
                callback();
            }            
        });
        
        return v8bp;
    };
    
    /**
     * Based on a breakpoint from the model, you can get the v8 breakpoint
     */
    this.$getV8BreakpointFromModel = function (node) {
        var id = node.getAttribute("script") + "|" + node.getAttribute("line");
        
        return this.$v8breakpoints[id];
    };
    
    /**
     * Binds a model node to a real v8 breakpoint
     */
    this.$bindV8BreakpointToModel = function (node, v8breakpoint) {
        var id = node.getAttribute("script") + "|" + node.getAttribute("line");
        
        this.$v8breakpoints[id] = v8breakpoint;
    };
    
    this.$getBreakpointXml = function(breakpoint, lineOffset, scriptId) {
        var xml = [];
        xml.push(
            "<breakpoint",
            " id='", breakpoint.$id,
            "' text='", this.$strip(apf.escapeXML(breakpoint.source)), ":", (parseInt(breakpoint.line, 10) + 1),
            "' script='", apf.escapeXML(breakpoint.source),
            scriptId ? "' scriptid='" + scriptId : "",
            "' lineoffset='", lineOffset || 0,
            "' line='", breakpoint.line,
            "' condition='", apf.escapeXML(breakpoint.condition || ""),
            "' ignorecount='", breakpoint.ignoreCount || 0,
            "' enabled='", breakpoint.enabled,
            "' />"
        );

        return xml.join("");
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
            var name = expression.trim();
            if (error) {
                str.push("<item type='.error' name=\"", apf.escapeXML(name),
                    "\" value=\"", apf.escapeXML(error.message), "\" />");
            }
            else {
                str.push(
                    "<item name=\"", apf.escapeXML(name),
                    "\" value='", apf.escapeXML(body.text), //body.value ||
                    "' type='", body.type,
                    "' ref='", body.handle,
                    body.constructorFunction ? "' constructor='" + body.constructorFunction.ref : "",
                    body.prototypeObject ? "' prototype='" + body.prototypeObject.ref : "",
                    body.properties && body.properties.length ? "' children='true" : "",
                    "' />"
              );
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
        var str     = [];
        var args    = frame.arguments;
        var argsStr = [];

        str.push(frame.func.name || frame.func.inferredName || "anonymous", "(");
        for (var i = 0, l = args.length; i < l; i++) {
            var arg = args[i];
            if (!arg.name)
                continue;
            argsStr.push(arg.name);
        }
        str.push(argsStr.join(", "), ")");
        return str.join("");
    };

    this.$serializeVariable = function(item, name) {
        var str = [
            "<item name='", apf.escapeXML(name || item.name),
            "' value='", apf.escapeXML(this.$valueString(item.value)),
            "' type='", item.value.type,
            "' ref='", typeof item.value.ref == "number" ? item.value.ref : item.value.handle,
            hasChildren[item.value.type] ? "' children='true" : "",
            "' />"
        ];
        return str.join("");
    };
    
}).call(V8Debugger.prototype = new apf.Class());

});
// #endif
