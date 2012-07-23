define(function(require, exports, module) {

var Breakpoint = require("debug/Breakpoint");
var V8Debugger = require("debug/V8Debugger");
var WSV8DebuggerService = require("debug/WSV8DebuggerService");
//var _debugger = require("ext/debugger/debugger")

var v8DebugClient = exports.v8DebugClient = function() {
};

(function() {
    this.$startDebugging = function() {
        var dbg = this.$debugger = dbg = new V8Debugger(0, this.$v8ds);
        this.$v8breakpoints = {};
        
        var onChangeRunning = this.onChangeRunning.bind(this);
        var onBreak = this.onBreak.bind(this);
        var onAfterCompile = this.onAfterCompile.bind(this);
        // register event listeners
        dbg.addEventListener("changeRunning", onChangeRunning);
        dbg.addEventListener("break", onBreak);
        dbg.addEventListener("afterCompile", onAfterCompile);

        this.setFrame(null);
        
        // on detach remove all event listeners
        this.removeListeners = function () {
            dbg.removeEventListener("changeRunning", onChangeRunning);
            dbg.removeEventListener("break", onBreak);
            dbg.removeEventListener("afterCompile", onAfterCompile);
        };
    };
    
    this.onChangeRunning = function(e) {
        if (!this.$debugger) {
            this.state = null;
        } else {
            this.state = this.$debugger.isRunning() ? "running" : "stopped";
        }
    console.trace()
    console.log(this.state)
        ide.dispatchEvent("dbg.changeState", this);
        
        if (this.state != "stopped") {
            this.setFrame(null);
        }
    };
        
    this.onBreak = function(e) {
        var _self = this;
        this.backtrace(function() {
            ide.dispatchEvent("break", _self.activeFrame);
        });
    };
        
    this.onAfterCompile = function(e) {
        ide.dispatchEvent("afterCompile", {script: apf.getXml(this.$getScriptXml(e.data.script))});
    };

    this.attach = function(callback) {
        var _self = this;
        callback = callback || function(err, dbgImpl) {
            ide.dispatchEvent("dbg.attached", dbgImpl);
            _self.onChangeRunning();
            _self.syncAfterAttach();
        }

        var dbg = this.$debugger;            
        if (dbg)
            return callback && callback(null, this)
    
        if (!this.$v8ds)
            this.$v8ds = new WSV8DebuggerService(ide.socket);
        
        this.$v8ds.attach(0, function() {
            _self.$startDebugging();
            callback && callback(null, _self)
        });
    };
    
    this.syncAfterAttach = function () {
        var _self = this;
        _self.scripts(mdlDbgSources, function() {
            // sync the breakpoints that we have in the IDE with the server
            _self.setBreakpoints(mdlDbgBreakpoints, function() {
                // and if we find something
                _self.backtrace(function() {
                    var frame = mdlDbgStack.queryNode("frame[1]");                
                    
                    //if (frame)
                    // _self.continueScript();
                    ide.dispatchEvent("break", _self.activeFrame);
                    _self.onChangeRunning();                    
                });
            });
        });
    };
    
    this.detach = function(callback) {
        if (!this.$debugger)
            return callback();
            
        var dbg = this.$debugger;
        this.$debugger = null;
        this.onChangeRunning();

        var _self = this;
        this.removeListeners();
        this.$v8ds.detach(0, function(err) {
            callback && callback(err);
            _self.$v8ds = null;
        });
    };
    
    
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

    this.backtrace = function(callback) {
        var _self = this;
        var model = mdlDbgStack;
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
        ide.dispatchEvent("dbg.changeFrame", {data: frame});
    };


    this.getactiveFrame = function() {
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
            var script = ide.workspaceDir + "/" + bp.getAttribute("scriptPath");
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
    this.toggleBreakpoint = function(script, relativeRow, model, content) {
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
                content : content,
                lineOffset: lineOffset,
                scriptId: script.getAttribute("scriptid")
            }, model);
        }
    };
    
    this.setBreakPointEnabled = function(node, value){
        var v8bp = this.$getV8BreakpointFromModel(node);
        if (v8bp.enabled != value) {
            v8bp.setEnabled(value);
            v8bp.flush();
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
        if (options.data)
            apf.extend(v8bp, options.data);
        if (options.content)
            v8bp.content = options.content;
        
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
            "' content='", apf.escapeXML(breakpoint.content || ""),
            "' condition='", apf.escapeXML(breakpoint.condition || ""),
            "' ignorecount='", breakpoint.ignoreCount || 0,
            "' enabled='", breakpoint.enabled,
            "' />"
        );

        return xml.join("");
    };

    this.continueScript = function(stepaction, stepcount, callback) {
        this.$debugger.continueScript(stepaction, stepcount, callback);
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
    
}).call(v8DebugClient.prototype);


ide.addEventListener("dbg.ready", function(e) {
    if (e.type = "node-debug-ready") {
        if (!exports.dbgImpl) {
            exports.dbgImpl = new v8DebugClient();
            exports.dbgImpl.attach();
        }
    }
});

ide.addEventListener("dbg.exit", function(e) {
    ide.dispatchEvent("beforecontinue");
    if (exports.dbgImpl) {
        exports.dbgImpl.detach();
        exports.dbgImpl = null;
    }
});

ide.addEventListener("dbg.state", function(e) {
    if (e["node-debug"] && !exports.dbgImpl) {
        exports.dbgImpl = new v8DebugClient();
        exports.dbgImpl.attach();
    }
})

});
