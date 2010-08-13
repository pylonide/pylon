
apf.debughost = function(struct, tagName){
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
        "model-tabs", "state-connected");

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
        if (this.$host) {
            return;
        }
        
        if (this.type == "chrome" || this.type == "v8") {
            // TODO #IDE-52
            if (!apf.debughost.$o3obj) {
                apf.debughost.$o3obj = window.o3Obj || o3.create("8A66ECAC-63FD-4AFA-9D42-3034D18C88F4", { 
                    oninstallprompt: function() { alert("can't find o3 plugin"); },
                    product: "O3Demo"
                }); 
            }

            if (this.type == "chrome") {
                this.$host = new apf.ChromeDebugHost(this.server, this.port, apf.debughost.$o3obj);
            } else {
                this.$host = new apf.V8DebugHost(this.server, this.port, apf.debughost.$o3obj);
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
        if (!this.host)
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
        
        if (tab) {
            var id = tab.getAttribute("id");
        } else {
            var id = null;
        }
        
        this.$host.attach(id, callback);
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
