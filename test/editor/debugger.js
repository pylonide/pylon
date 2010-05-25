
(function() {
    
apf.$debugger = {
    breakpoints: {},
    scripts: {}
};

apf.$debugger.init = function() {
    this.loadTabs();
    window.onunload = ace.bind(this.disconnect, this);
};

function escapeXml(str) {
    return (str.toString()
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/'/g, "&apos;")
    );
}

function valueString(value) {
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

function frameToString(frame) {
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

function serializeVariable(item, name) {
    var str = [];
    var hasChildren = {
        "object": 8,
        "function": 4
    };
    str.push("<item name='", escapeXml(name || item.name),
        "' value='", escapeXml(valueString(item.value)),
        "' type='", item.value.type,
        "' ref='", item.value.ref || item.value.handle,
        hasChildren[item.value.type] ? "' children='true" : "",
        "' />");
    return str.join("");            
}

apf.$debugger.loadTabs = function() {
    var o3obj = document.getElementsByTagName("embed")[0];
    var socket = apf.$debugger.$socket = new O3Socket("127.0.0.1", 9222, o3obj);
    var msgStream = new ChromeDebugMessageStream(socket);

    msgStream.addEventListener("connect", function() {
        var dts = apf.$debugger.dts = new DevToolsService(msgStream);
        var v8ds = apf.$debugger.v8ds = new V8DebuggerService(msgStream);
        
        dts.getVersion(function(version) {
            dts.listTabs(function(tabs) {
                var xml = [];
                for (var i = 0; i < tabs.length; i++) {
                    xml.push("<tab id='" + tabs[i][0] + "'>" + escapeXml(tabs[i][1]) + "</tab>");
                }
                $apf_dbg_mdlTabs.load("<tabs>" + xml.join("") + "</tabs>");  
            });
        });
    });
    
    msgStream.connect();
}

function onBreak(e) {
    apf.$debugger.dbg.backtrace(null, null, null, true, function(body, refs) {
        
        function ref(id) {
            for (var i=0; i<refs.length; i++) {
                if (refs[i].handle == id) {
                    return refs[i];
                }
            }
            return {};
        }
        
        var xml = [];
        var frames = body.frames;
        for (var i = 0; i < frames.length; i++) {
            var frame = frames[i];
            var script = ref(frame.script.ref);
            xml.push("<frame index='", frame.index, 
                "' name='", escapeXml(escapeXml(frameToString(frame))),
                "' column='", frame.column,
                "' line='", frame.line,
                "' script='", script.name,
                "' script_id='", script.id,
                "'>");
            xml.push("<vars>");
            for (var j=0; j<frame.arguments.length; j++) {
                if (frame.arguments[j].name) 
                    xml.push(serializeVariable(frame.arguments[j]));
            }
            for (var j=0; j<frame.locals.length; j++) {
                if (frame.locals[j].name !== ".arguments")
                    xml.push(serializeVariable(frame.locals[j]));
            }
            xml.push("</vars>");
            xml.push("</frame>");
        }
        $apf_dbg_mdlStack.load("<frames>" + xml.join("") + "</frames>");          
    });
}

function onContinue() {
    $apf_dbg_mdlStack.load("<frames></frames>");

    if (apf.$debugger.$marker) {
        ce.$editor.renderer.removeMarker(apf.$debugger.$marker);
        apf.$debugger.$marker = null;
    }    
}

apf.$debugger.attach = function(tabId) {
    apf.$debugger.v8ds.attach(tabId, function() {
        $apf_dbg_mdlDebugger.setQueryValue("@connected", true);
        
        var dbg = apf.$debugger.dbg = new V8Debugger(tabId, apf.$debugger.v8ds);
               
        dbg.addEventListener("break", onBreak);
        dbg.addEventListener("changeRunning", function() {
            $apf_dbg_mdlDebugger.setQueryValue("@running", dbg.isRunning());
            if (dbg.isRunning()) {
                onContinue()
            };
        });
        
        dbg.version(function(version) {
            dbg.scripts(4, null, false, function(scripts) {
                var xml = [];
                for (var i = 0; i < scripts.length; i++) {
                    var script = scripts[i];
                    apf.$debugger.scripts[script.id] = script;
                    if (script.name && script.name.indexOf("chrome-extension://") == 0) {
                        continue;
                    }
                    xml.push("<script id='", script.id, 
                        "' name='", escapeXml(script.name || "anonymous"), 
                        "' text='", escapeXml(script.text || "anonymous"), 
                        "' lineoffset='", script.lineOffset,                    
                        "' />");
                }
                $apf_dbg_mdlScripts.load("<scripts>" + xml.join("") + "</scripts>");  
            });
        });
    });
}    

apf.$debugger.changeStackFrame = function(frame) {
    var script = apf.$debugger.scripts[frame.getAttribute("script_id")];
    if (!script)
        return;
    
    lstScripts.select($apf_dbg_mdlScripts.queryNode("//node()[@id='" + script.id + "']"));
    
    if (apf.$debugger.$marker) {
        ce.$editor.renderer.removeMarker(apf.$debugger.$marker);
        apf.$debugger.$marker = null;
    }

    var row = parseInt(frame.getAttribute("line")) - script.lineOffset;
    range = new ace.Range(row, 0, row+1, 0);
    apf.$debugger.$marker = ce.$editor.renderer.addMarker(range, "step", "text");
    apf.$debugger.$markerRange = range;
    apf.$debugger.$markerScript = script;
    
    ce.$editor.moveCursorTo(row, parseInt(frame.getAttribute("line")));
};

apf.$debugger.changeScript = function(scriptEl) {
    var ctx = apf.$debugger;
    if (ctx.$marker)
        ce.$editor.renderer.removeMarker(ctx.$marker);

    var script = ctx.$markerScript;
    if (script && script.id == scriptEl.getAttribute("id")) {
        ctx.$marker = ce.$editor.renderer.addMarker(ctx.$markerRange, "step", "text");
    }
};

apf.$debugger.disconnect = function() {
    if (!this.dbg) {
        this.$socket.close();
        return;
    }
    
    this.v8ds.detach(apf.$debugger.dbg.tabId, function() {        
        apf.$debugger.$socket.close();
    });
    
    $apf_dbg_mdlDebugger.setQueryValue("@connected", false);
    $apf_dbg_mdlScripts.load("<scripts></scripts>");
    $apf_dbg_mdlStack.load("<frames></frames>");
};

apf.$debugger.toggleBreakPoint = function(scriptId, relativeRow) {
    var ctx = apf.$debugger;
    
    var script = ctx.scripts[scriptId];
    if (!script)
        return;
    
    var row = script.lineOffset + relativeRow;
    var id = scriptId + "|" + row;
    
    var breakpoint = ctx.breakpoints[id]; 
    if (breakpoint) {
        delete ctx.breakpoints[id];
        breakpoint.clear(function() {
            ce.$editor.getDocument().clearBreakpoint(relativeRow);
        });
    } else {
        breakpoint = apf.$debugger.breakpoints[id] = new Breakpoint(script.name, row);
        breakpoint.attach(ctx.dbg, function() {
            ce.$editor.getDocument().setBreakpoint(breakpoint.line - script.lineOffset);

            var xml = [];
            xml.push("<breakpoint",
                " id='", breakpoint.$id,
                "' text='", escapeXml(script.name), ":", breakpoint.line,
                "' script='", escapeXml(script.name),
                "' scriptId='", script.id,
                "' line='", breakpoint.line,       
                "' condition='", escapeXml(breakpoint.condition || ""),
                "' ignorecount='", breakpoint.ignoreCount || 0,
                "' enabled='", breakpoint.enabled,
                "' />")
            $apf_dbg_mdlBreakpoints.appendXml(xml.join(""));
        });
    }
};

apf.$debugger.continueScript = function() {
    apf.$debugger.dbg.continueScript();
};

apf.$debugger.stepInto = function() {
    apf.$debugger.dbg.continueScript("in", 1);
};

apf.$debugger.stepNext = function() {
    apf.$debugger.dbg.continueScript("next", 1);
};

apf.$debugger.stepOut = function() {
    apf.$debugger.dbg.continueScript("out", 1);
};

window.$adbg = {
   exec : function(method, args, callback, options){
        if (method == "loadScript" && args[0]) {
            if (!options)
                options = {};
            if (!options.callback)
                options.callback = function(data, state, extra){
                    if (state != apf.SUCCESS) {
                        callback("<script />", state, extra);
                        return false;
                    }
                    else {
                        callback("<script>" + escapeXml(data) + "</script>", state, extra);
                    }
                }
            this.loadScript(args[0], options);
        }
        else if (method == "loadObjects" && args[0]) {
            if (!options)
                options = {};
            if (!options.callback)
                options.callback = function(data, state, extra){
                    if (state != apf.SUCCESS) {
                        callback("<item />", state, extra);
                        return false;
                    }
                    else {
                        callback(data, state, extra);
                    }
                }
            
            this.loadObjects(args[0].getAttribute("ref"), options);
        }
    },
    
    loadScript : function(id, options) {
        apf.$debugger.dbg.scripts(4, [parseInt(id)], true, function(scripts) {
            if (scripts.length) {                
                var script = scripts[0];
                apf.$debugger.scripts[script.id].source = script.source;
                options.callback(script.source, apf.SUCCESS);
            }
        });
    },
    
    loadObjects : function(ref, options) {
        apf.$debugger.dbg.lookup([ref], false, function(body) {
            var refs = [];
            var props = body[ref].properties;
            for (var i=0; i<props.length; i++) {
                refs.push(props[i].ref);
            }

            apf.$debugger.dbg.lookup(refs, false, function(body) {
                var xml = ["<item>"];
                for (var i=0; i<props.length; i++) {
                    props[i].value = body[props[i].ref];
                    xml.push(serializeVariable(props[i]));
                }
                xml.push("</item>");
                options.callback(xml.join(""), apf.SUCCESS);
            });
        });
    }
};
(apf.$asyncObjects || (apf.$asyncObjects = {}))["$adbg"] = 1;

})();