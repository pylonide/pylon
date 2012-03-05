// #ifdef __AMLDEBUGGER || __INC_ALL
if (apf.hasRequireJS) define("apf/elements/debughost",
    ["module",
     "apf/elements/dbg/chromedebughost",
     "apf/elements/dbg/v8debughost", 
     "apf/elements/dbg/v8websocketdebughost"],
    function(module, ChromeDebugHost, V8DebugHost, V8WebSocketDebugHost) {

apf.debughost = module.exports = function(struct, tagName){
    this.$init(tagName || "debughost", apf.NODE_HIDDEN, struct);
};

(function(){

    this.port = 9222;
    this.server = "localhost";
    this.type = "chrome";
    this.autoinit = false;
    this.$modelTabs = null;
    this.$stateConnected = null;
    
    this.$host = null;
    
    this.$booleanProperties["autostart"] = true;
    
    this.$supportedProperties.push("port", "server", "type", "autoinit",
        "model-tabs", "state-connected", "strip");

    this.$propHandlers["model-tabs"] = function(value) {
        if (!value) return;
        //#ifdef __WITH_NAMESERVER
        this.$modelTabs = apf.nameserver.get("model", value) || 
            apf.setReference(value, apf.nameserver.register("model", value, new apf.model()));
        
        // set the root node for this model
        this.$modelTabs.id = this.$modelTabs.name = value;
        this.$modelTabs.load("<tabs/>");
        //#endif
    };

    this.$propHandlers["state-connected"] = function(value) {
        if (!value) return;
        //#ifdef __WITH_NAMESERVER
        this.$stateConnected = apf.nameserver.get("state", value) || 
            apf.setReference(value, apf.nameserver.register("state", value, new apf.state()));
        
        // set the root node for this model
        this.$stateConnected.id = this.$stateConnected.name = value;
        this.$stateConnected.deactivate();
        //#endif
    };
    
    this.init = function() {
        if (this.$host)
            return;
        
        if (this.type == "chrome" || this.type == "v8" || this.type == "v8-ws") {
            if (!apf.debughost.$o3obj && this.type !== "v8-ws") {
                apf.debughost.$o3obj = window.o3Obj || o3.create("8A66ECAC-63FD-4AFA-9D42-3034D18C88F4", { 
                    oninstallprompt: function() { alert("can't find o3 plugin"); },
                    product: "O3Demo"
                }); 
            }

            if (this.type == "chrome") {
                this.$host = new ChromeDebugHost(this.server, this.port, apf.debughost.$o3obj);
            }
            else if (this.type == "v8") {
                this.$host = new V8DebugHost(this.server, this.port, apf.debughost.$o3obj);
            }
            else if (this.type == "v8-ws") {
                var socket = this.dispatchEvent("socketfind");
                if (!socket)
                    throw new Error("no socket found!")
                this.$host = new V8WebSocketDebugHost(socket);
            }
            else if (this.type == "chrome-ws") {
                var socket = this.dispatchEvent("socketfind");
                if (!socket)
                    throw new Error("no socket found!")
                this.$host = new ChromeDebugHost(null, null, null, socket);
            }
                
            var self = this;
            this.$host.addEventListener("connect", function() {
                self.dispatchEvent("connect");
                self.$stateConnected.activate();
            });
            this.$host.addEventListener("disconnect", function() {
                self.dispatchEvent("disconnect");
                self.$stateConnected.deactivate();
            });
            
            this.loadTabs();
        }
    };
    
    this.loadTabs = function() {
        if (!this.$host)
            this.init();
        
        var self = this;
        this.$host.loadTabs(this.$modelTabs, function() {
            self.$dispatchEvent("tabsloaded");
        });        
    }
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e) {
        if (this.autoinit)
            this.init();
    });
    
    this.$attach = function(dbg, tab, callback) {        
        if (!this.$host) 
            this.init();
        
        var id = tab ? tab.getAttribute("id") : null;
        
        var _self = this;
        this.$host.attach(id, function(err, dbg) {
            dbg.setStrip(_self.strip || "");
            callback(err, dbg);
        });
    };

    this.$detach = function(dbgImpl, callback) {
        if (!this.$host) 
            return;
        
        this.$host.detach(dbgImpl, callback);
    };
    
    this.disconnect = function() {
        if (!this.$host) 
            return;
        
        this.$host.disconnect();
        this.$host = null;
    };
    
}).call(apf.debughost.prototype = new apf.AmlElement());

apf.aml.setElement("debughost", apf.debughost);

});
// #endif
