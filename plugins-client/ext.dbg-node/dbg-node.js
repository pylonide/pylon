/**
 * node debugger Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var V8Debugger = require("v8debug/V8Debugger");
var ide = require("core/ide");
var util = require("core/util");
var oop = require("ace/lib/oop");
var DebuggerService = require("ext/dbg-node/service");
var DebugHandler = require("ext/debugger/debug_handler");
var extDebugger = require("ext/debugger/debugger");

/*global mdlDbgSources mdlDbgBreakpoints mdlDbgStack */

var v8DebugClient = module.exports = function() {
    this.stripPrefix = ide.workspaceDir || "";
};

oop.inherits(v8DebugClient, DebugHandler);

(function() {
    this.$startDebugging = function() {
        var v8dbg = this.$v8dbg = new V8Debugger(0, this.$v8ds);
        this.$v8breakpoints = {};

        var onChangeRunning = this.onChangeRunning.bind(this);
        var onBreak = this.onBreak.bind(this);
        var onException = this.onException.bind(this);
        var onAfterCompile = this.onAfterCompile.bind(this);
        // register event listeners
        v8dbg.addEventListener("changeRunning", onChangeRunning);
        v8dbg.addEventListener("break", onBreak);
        v8dbg.addEventListener("exception", onException);
        v8dbg.addEventListener("afterCompile", onAfterCompile);

        this.onChangeFrame(null);

        // on detach remove all event listeners
        this.removeListeners = function () {
            v8dbg.removeEventListener("changeRunning", onChangeRunning);
            v8dbg.removeEventListener("break", onBreak);
            v8dbg.removeEventListener("exception", onException);
            v8dbg.removeEventListener("afterCompile", onAfterCompile);
        };
    };

    this.$syncAfterAttach = function () {
        var _self = this;
        _self.loadSources(function() {
            _self.backtrace(function() {
                _self.updateBreakpoints(function() {
                    _self.$v8dbg.listbreakpoints(function(e){
                        _self.$handleDebugBreak(e.breakpoints);
                    });
                });
                if (_self.activeFrame)
                    ide.dispatchEvent("dbg.break", {frame: _self.activeFrame});
                _self.onChangeRunning();
            });
        });
    };

    this.attach = function(pid, runner) {
        if (this.$v8ds)
            this.$v8ds.disconnect();
        this.pid = pid;
        this.$v8ds = new DebuggerService(pid, runner);
        this.$v8ds.connect();
        this.$startDebugging();
        this.$syncAfterAttach();
    };

    this.detach = function() {
        this.$v8ds.disconnect();
        this.$v8ds = null;
        this.$v8dbg = null;
        this.onChangeRunning();
        this.removeListeners();
    };

    this.onChangeRunning = function(e) {
        if (!this.$v8dbg) {
            this.state = null;
        } else {
            this.state = this.$v8dbg.isRunning() ? "running" : "stopped";
        }

        ide.dispatchEvent("dbg.changeState", {state: this.state});

        if (this.state != "stopped")
            this.onChangeFrame(null);
    };

    this.onBreak = function(e) {
        var _self = this;
        this.backtrace(function() {
            ide.dispatchEvent("dbg.break", {frame: _self.activeFrame});
        });
    };

    this.onException = function(e) {
        var _self = this;
        this.backtrace(function() {
            ide.dispatchEvent("dbg.exception", {frame: _self.activeFrame, exception: e.exception});
        });
    };

    this.onAfterCompile = function(e) {
        var script = apf.getXml(this.$getScriptXml(e.data.script));
        var id = script.getAttribute("scriptid");
        var oldNode = mdlDbgSources.queryNode("//file[@scriptid='" + id + "']");
        if (oldNode)
            mdlDbgSources.removeXml(oldNode);
        mdlDbgSources.appendXml(script);
    };

    this.onChangeFrame = function(frame) {
        this.activeFrame = frame;
        ide.dispatchEvent("dbg.changeFrame", {data: frame});
    };

    this.$handleDebugBreak = function(remoteBreakpoints) {
        var frame = this.activeFrame;
        if (!frame || !this.$v8dbg)
            return;
        var bp = remoteBreakpoints[0];
        if (bp.number != 1)
            return;

        var uibp = mdlDbgBreakpoints.queryNode(
            "//breakpoint[@line='" + frame.getAttribute("line") +"' and @path='" +
            frame.getAttribute("scriptPath") + "']"
        ) || mdlDbgBreakpoints.queryNode(
            "//breakpoint[@line='" + bp.line +"' and @path='" +
            this.getPathFromScriptId(bp.script_id) + "']"
        );

        if (uibp && uibp.getAttribute("enabled") == "true")
            return;

        this.$v8dbg.clearbreakpoint(1, function(){});
        this.resume();
    };

    // apf xml helpers
    var hasChildren = {
        "object": 8,
        "function": 4
    };

    this.$strip = function(str) {
        return str.lastIndexOf(this.stripPrefix, 0) === 0
            ? str.slice(this.stripPrefix.length + 1)
            : str;
    };

    this.$getScriptXml = function(script) {
        return util.toXmlTag("file", {
            scriptid: script.id,
            scriptname: script.name || "anonymous",
            path: this.getLocalScriptPath(script),
            text: this.$strip(script.text || "anonymous"),
            lineoffset: script.lineOffset,
            debug: "true"
        });
    };

    function getId(frame){
        return (frame.func.name || frame.func.inferredName || (frame.line + frame.position));
    }

    this.$isSameFrameset = function(xmlFrameSet, frameSet){
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

    this.getScriptIdFromPath = function(path) {
        var script = mdlDbgSources.queryNode("//file[@path=" + util.escapeXpathString(path) + "]");
        if (!script)
            return;
        return script.getAttribute("scriptid");
    };

    this.getScriptnameFromPath = function(path) {
        if (!path)
            return;
        var script = mdlDbgSources.queryNode("//file[@path=" + util.escapeXpathString(path) + "]");
        if (script)
            return script.getAttribute("scriptname");
        // if script isn't added yet reconstruct it's name from ide.workspaceDir
        if (path.substring(0, ide.davPrefix.length) != ide.davPrefix)
            return path;
        path = path.substr(ide.davPrefix.length);
        if (ide.workspaceDir.slice(1, 3) == ":\\")
            path = path.replace(/\//g, "\\");
        return ide.workspaceDir + path;
    };

    this.getPathFromScriptId = function(scriptId) {
        var script = mdlDbgSources.queryNode("//file[@scriptid='" + scriptId + "']");
        if (!script)
            return;
        return script.getAttribute("path");
    };

    this.getLocalScriptPath = function(script) {
        var scriptName = script.name || ("-anonymous-" + script.id);
        if (scriptName.substring(0, ide.workspaceDir.length) == ide.workspaceDir)
            scriptName = ide.davPrefix + scriptName.substr(ide.workspaceDir.length);
        // windows paths come here independantly from vfs
        return scriptName.replace(/\\/g, "/");
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
        }
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
        return util.toXmlTag("item", {
            name: name || item.name,
            value: this.$valueString(item.value),
            type: item.value.type,
            ref: typeof item.value.ref == "number" ? item.value.ref : item.value.handle,
            children: hasChildren[item.value.type] ? "true" : "false"
        });
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
        xml.push(util.toXmlTag("frame", {
            index: frame.index,
            name: apf.escapeXML(this.$frameToString(frame)), //dual escape???
            column: frame.column,
            id: getId(frame),
            ref: frame.ref,
            line: frame.line,
            script: this.$strip(script.name),
            scriptPath: this.getLocalScriptPath(script),
            scriptid: frame.func.scriptId //script.id,
        }, true));
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
            xml.push(util.toXmlTag("scope", {
                index: scope.index,
                type: scope.type
            }));
        }
        xml.push("</scopes>");

        xml.push("</frame>");
    };

    this.loadSources = function(callback) {
        var model = mdlDbgSources;
        var _self = this;
        this.$v8dbg.scripts(4, null, false, function(scripts) {
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

    this.backtrace = function(callback) {
        var _self = this;
        var model = mdlDbgStack;
        this.$v8dbg.backtrace(null, null, null, true, function(body, refs) {
            function ref(id) {
                for (var i=0; i<refs.length; i++) {
                    if (refs[i].handle == id) {
                        return refs[i];
                    }
                }
                return {};
            }

            var i;
            var l;
            var frames    = body.frames;
            var xmlFrames = model.queryNodes("frame");
            if (xmlFrames.length && _self.$isSameFrameset(xmlFrames, frames)) {
                for (i = 0, l = frames.length; i < l; i++)
                    _self.$updateFrame(xmlFrames[i], frames[i]);
            }
            else {
                var xml = [];
                if (frames) {
                    for (i = 0, l = frames.length; i < l; i++)
                        _self.$buildFrame(frames[i], ref, xml);
                }
                model.load("<frames>" + xml.join("") + "</frames>");
            }

            var topFrame = model.data.firstChild;
            topFrame && topFrame.setAttribute("istop", true);
            _self.onChangeFrame(topFrame);
            callback();
        });
    };

    this.loadSource = function(script, callback) {
        var id = script.getAttribute("scriptid");
        this.$v8dbg.scripts(4, [id], true, function(scripts) {
            if (!scripts.length)
                return;
            var script = scripts[0];
            callback(script.source);
        });
    };

    this.loadObject = function(item, callback) {
        var ref   = item.getAttribute("ref");
        var _self = this;
        this.$v8dbg.lookup([ref], false, function(body) {
            var refs  = [];
            var props = body[ref].properties;
            for (var i = 0, l = props.length; i < l; i++)
                refs.push(props[i].ref);

            _self.$v8dbg.lookup(refs, false, function(body) {
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
        function addFrame(body) {
            var props = body.object.properties;
            for (var j = 0, l2 = props.length; j < l2; j++)
                xml.push(_self.$serializeVariable(props[j]));
            processed += 1;
            if (processed == expected) {
                xml.push("</vars>");
                callback(xml.join(""));
            }
        }

        for (var i = 0, l = scopes.length; i < l; i++) {
            var scope = scopes[i];
            var type = parseInt(scope.getAttribute("type"), 10);

            // ignore local and global scope
            if (type > 1) {
                expected += 1;
                var index = parseInt(scope.getAttribute("index"), 10);
                this.$v8dbg.scope(index, frameIndex, true, addFrame);
            }
        }
        if (expected === 0)
            return callback("<vars />");
    };

    this.resume = function(stepaction, stepcount, callback) {
        this.$v8dbg.continueScript(stepaction, stepcount, callback);
    };

    this.suspend = function() {
        this.$v8dbg.suspend();
    };

    this.lookup = function(handles, includeSource, callback) {
        this.$v8dbg.lookup(handles, includeSource, callback);
    };

    this.changeLive = function(scriptId, newSource, previewOnly, callback) {
        var NODE_PREFIX = "(function (exports, require, module, __filename, __dirname) { ";
        var NODE_POSTFIX = "\n});";
        newSource = NODE_PREFIX + newSource + NODE_POSTFIX;
        var _self = this;
        this.$v8dbg.changelive(scriptId, newSource, previewOnly, function(e) {
            callback(e);
            _self.backtrace(function(){});
        });
    };

    this.evaluate = function(expression, frame, global, disableBreak, callback) {
        this.$v8dbg.evaluate(expression, frame, global, disableBreak, function(body, refs, error){
            var str = [];
            var name = expression.trim();
            if (error) {
                str.push(util.toXmlTag("item", {
                    type: ".error",
                    name: name,
                    value: error.message
                }));
            }
            else {
                var props = {
                    name: name,
                    value: body.text,
                    type: body.type,
                    ref: body.handle
                };
                if (body.constructorFunction)
                    props.contructor = body.constructorFunction.ref;
                if (body.prototypeObject)
                    props.prototype = body.prototypeObject.ref;
                if (body.properties && body.properties.length)
                    props.children = "true";
                str.push(util.toXmlTag("item", props));
            }
            callback(apf.getXml(str.join("")), body, refs, error);
        });
    };

    this.updateBreakpoints = function(callback) {
        var _self = this;

        // read all the breakpoints, then call the debugger to actually set them
        var uiBreakpoints = this.$getUIBreakpoints();

        // keep track of all breakpoints and check if they're really added
        var counter = 0;

        var createdBreakpoints = this.$v8breakpoints;
        this.$v8breakpoints = {};

        uiBreakpoints.forEach(function(bp) {
            bp.scriptname = _self.getScriptnameFromPath(bp.path);
            if (!bp.scriptname)
                return;
            bp.$location = bp.scriptname + "|" + bp.line + ":" + bp.column;

            var oldBp = createdBreakpoints[bp.$location];

            // enabled doesn't work with v8debug so we just skip those
            if (!bp.enabled)
                return;

            delete createdBreakpoints[bp.$location];
            if (oldBp && isEqual(oldBp, bp)) {
                _self.$v8breakpoints[bp.$location] = oldBp;
            }
            else {
                _self.$v8breakpoints[bp.$location] = bp;
                addBp(bp);
            }
        });

        for (var i in createdBreakpoints)
            removeBp(createdBreakpoints[i]);

        function bpCallback(bp) {
            var location = bp.script_name + "|" + bp.line + ":" + (bp.column || 0);
            var uiBp = _self.$v8breakpoints[location];
            if (uiBp) {
                if (!uiBp.id || uiBp.id < bp.breakpoint) {
                    uiBp.id = bp.breakpoint;
                }
            }
            counter--;
            if (!counter)
                callback && callback();
        }

        function addBp(bp) {
            counter++;
            _self.$v8dbg.setbreakpoint("script", bp.scriptname, bp.line, bp.column, bp.enabled, bp.condition, bp.ignoreCount, bpCallback);
        }

        function removeBp(bp) {
            bp.id && _self.$v8dbg.clearbreakpoint(bp.id, function(){});
        }
        function isEqual(bp1, bp2) {
            return bp1.$location == bp2.$location && bp1.condition == bp2.condition && bp1.ignoreCount == bp2.ignoreCount;
        }

        if (!counter)
            callback && callback();
    };

}).call(v8DebugClient.prototype);

v8DebugClient.handlesRunner = function(runner) {
    return runner === "node";
};

extDebugger.registerDebugHandler(v8DebugClient);

});
