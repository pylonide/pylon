var debugContext = {};

function loadTabs(){
    var o3obj = document.getElementsByTagName("embed")[0];
    var socket = new O3Socket("127.0.0.1", 9222, o3obj);
    var msgStream = new V8DebugMessageStream(socket);

    msgStream.addEventListener("connect", function() {
        var dts = debugContext.dts = new DevToolsService(msgStream);
        var v8ds = debugContext.v8ds = new V8DebuggerService(msgStream);
        
        dts.listTabs(function(tabs) {
            var xml = [];
            for (var i = 0; i < tabs.length; i++) {
                xml.push("<tab id='" + tabs[i][0] + "'>" + tabs[i][1] + "</tab>");
            }
            mdlTabs.load("<tabs>" + xml.join("") + "</tabs>");  
        });
    });
    
    msgStream.connect();
}

loadTabs();


function attachDebugger(tabId) {
    debugContext.v8ds.attach(tabId, function() {
        console.log("attached");
    
        var v8debugger = debugContext.v8debugger = new V8Debugger(tabId, debugContext.v8ds);
        v8debugger.scripts(4, null, false, function(scripts) {
            var xml = [];
            for (var i = 0; i < scripts.length; i++) {
                var script = scripts[i]
                xml.push("<script id='" + script.id + "' name='" + (script.name || "anonymous").escapeHTML() + "' partial='true' />");
            }
            mdlScripts.load("<scripts>" + xml.join("") + "</scripts>");  
        });
    });
}    
    
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
                        callback("<script>" + data.escapeHTML() + "</script>", state, extra);
                }
            this.loadScript(args[0], options);
        }
    },
    
    loadScript : function(id, options){
        debugContext.v8debugger.scripts(4, [parseInt(id)], true, function(scripts) {
            console.log(scripts);
            options.callback(scripts[0].source, apf.SUCCESS);
            
        });
    }
};
(apf.$asyncObjects || (apf.$asyncObjects = {}))["adbg"] = 1;
