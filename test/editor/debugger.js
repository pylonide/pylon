var debugContext = {
    breakpoints: {},
    scripts: {}
};

function escapeXml(str) {
    return (str
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/'/g, "&apos;")
    );
}


function loadTabs(){
    var o3obj = document.getElementsByTagName("embed")[0];
    var socket = debugContext.socket = new O3Socket("127.0.0.1", 9222, o3obj);
    var msgStream = new V8DebugMessageStream(socket);

    msgStream.addEventListener("connect", function() {
        var dts = debugContext.dts = new DevToolsService(msgStream);
        var v8ds = debugContext.v8ds = new V8DebuggerService(msgStream);
        
        dts.getVersion(function(version) {
            dts.listTabs(function(tabs) {
                var xml = [];
                for (var i = 0; i < tabs.length; i++) {
                    xml.push("<tab id='" + tabs[i][0] + "'>" + escapeXml(tabs[i][1]) + "</tab>");
                }
                mdlTabs.load("<tabs>" + xml.join("") + "</tabs>");  
            });
        });
    });
    
    msgStream.connect();
}

loadTabs();


function attachDebugger(tabId) {
    debugContext.v8ds.attach(tabId, function() {
        var v8debugger = debugContext.v8debugger = new V8Debugger(tabId, debugContext.v8ds);
               
        v8debugger.addEventListener("changeRunning", function() {
            console.log("running:", v8debugger.isRunning())
            btnContinue.setAttribute("disabled", v8debugger.isRunning());
        });
        
        v8debugger.version(function(version) {
            v8debugger.scripts(4, null, false, function(scripts) {
                var xml = [];
                for (var i = 0; i < scripts.length; i++) {
                    var script = scripts[i];
                    debugContext.scripts[script.id] = script;
                    if (script.name && script.name.indexOf("chrome-extension://") == 0) {
                        continue;
                    }
                    xml.push("<script id='", script.id, 
                        "' name='", escapeXml(script.name || "anonymous"), 
                        "' text='", escapeXml(script.text || "anonymous"), 
                        "' lineoffset='", script.lineOffset,                    
                        "' />");
                }
                mdlScripts.load("<scripts>" + xml.join("") + "</scripts>");  
            });
        });
    });
}    

function disconnect() {
    if (!debugContext.v8debugger) {
        debugContext.socket.close();
        return;
    }
    
    debugContext.v8ds.detach(debugContext.v8debugger.tabId, function() {        
        debugContext.socket.close();
    });
};

window.onunload = disconnect;

function toggleBreakPoint(scriptId, relativeRow) {
    var ctx = debugContext;
    
    var script = ctx.scripts[scriptId];
    if (!script)
        return;
    
    var row = script.lineOffset + relativeRow + 1;
    var id = scriptId + "|" + row;
    
    var breakpoint = ctx.breakpoints[id]; 
    if (breakpoint) {
        delete ctx.breakpoints[id];
        breakpoint.clear();
    } else {
        breakpoint = debugContext.breakpoints[id] = new Breakpoint(script.name, row);
        breakpoint.attach(ctx.v8debugger, function() {
            console.log("breakpoint set", breakpoint.line)
        });
    }
};

function continueScript() {
    debugContext.v8debugger.continueScript();
};

var adbg = {
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
                    else
                        callback("<script>" + escapeXml(data) + "</script>", state, extra);
                }
            this.loadScript(args[0], options);
        }
    },
    
    loadScript : function(id, options){
        debugContext.v8debugger.scripts(4, [parseInt(id)], true, function(scripts) {
            console.log(scripts)
            if (scripts.length) {
                var script = scripts[0];
                debugContext.scripts[script.id].source = script.source;
                options.callback(script.source, apf.SUCCESS);
            }
        });
    }
};
(apf.$asyncObjects || (apf.$asyncObjects = {}))["adbg"] = 1;
