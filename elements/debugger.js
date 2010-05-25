
apf.dbg = function(struct, tagName){
    this.$init(tagName || "debughost", apf.NODE_HIDDEN, struct);
};

(function(){
    
    this.$host = null;
    this.$debugger = null;
    
    this.$supportedProperties.push("state-running", "state-attached", 
        "model-sources", "model-stacks", "model-breakpoints");
  
    this.$createModelPropHandler = function(name, xml) {
        return function(value) {
            if (!value) return;
            
            this[name] = apf.setReference(value,
                apf.nameserver.register("model", value, new apf.model()));
            
            // set the root node for this model
            this[name].id = this[name].name = value;
            this[name].load(xml);
        }
    };

    this.$createStatePropHandler = function(name) {
        return function(value) {
            if (!value) return;
            
            this[name] = apf.setReference(value,
                    apf.nameserver.register("state", value, new apf.state()));
            
            // set the root node for this model
            this[name].id = this[name].name = value;
            this[name].deactivate();
        }
    };
    
    this.$propHandlers["model-sources"] = this.$createModelPropHandler("$mdlSources", "<sources />");
    this.$propHandlers["model-stacks"] = this.$createModelPropHandler("$mdlStacks", "<frames />");
    this.$propHandlers["model-breakpoints"] = this.$createModelPropHandler("$mdlBreakpoints", "<breakpoints />");

    this.$propHandlers["state-running"] = this.$createStatePropHandler("$stRunning");
    this.$propHandlers["state-attached"] = this.$createStatePropHandler("$stAttached");
    
    this.$getDebugger = function() {
        return this.$debugger;
    };
    
    this.attach = function(host, tab) {
        var self = this;
        host.$attach(this, tab, function(err, dbgImpl) {
            self.$host = host;
            self.$debugger = dbgImpl;
            
            self.$stAttached.activate();
            self.$stRunning.setProperty("active", dbgImpl.isRunning());
            
            self.$loadSources();
            
            dbgImpl.addEventListener("detach", function() {
                self.$host = null;
                self.$debugger = null;
                
                self.$mdlSources.load("<sources />");
                self.$mdlStacks.load("<stacks />");
                self.$mdlBreakpoints.load("<breakpoints />");
                self.$stAttached.deactivate();
            });
        });
    };

    this.detach = function(callback) {
        this.$host.$detach(this.$debugger, callback);
    };

    this.$loadSources = function(callback) {
        this.$debugger.scripts(this.$mdlSources, callback);        
    };
    
    this.loadScript = function(script, callback) {
        this.$debugger.loadScript(script, callback);
    };

    this.loadObjects = function(item, callback) {
        this.$debugger.loadScript(item, callback);
    };
    
    this.toggleBreakpoint = function(script, row) {
        this.$debugger.toggleBreakpoint(script, row, this.$mdlBreakpoints);
    };

}).call(apf.dbg.prototype = new apf.AmlElement());

apf.aml.setElement("debugger", apf.dbg);


window.adbg = {
    exec : function(method, args, callback, options) {
         if (method == "loadScript") {
             var dbg = args[0];
             var script = args[1];
             dbg.loadScript(script, function(source) {
                 if (options && options.callback) {
                     options.callback(apf.escapeXML(source), apf.SUCCESS);
                 } else {
                     callback("<script>" + apf.escapeXML(source) + "</script>", apf.SUCCESS);
                 }
             });
         }
         else if (method == "loadObjects") {
             var dbg = args[0];
             var item = args[1];
             
             dbg.loadObjects(item, function(xml) {
                 if (options && options.callback) {
                     options.callback(xml, apf.SUCCESS);
                 } else {
                     callback(xml, apf.SUCCESS);
                 }
             });
         }
     }
 };
(apf.$asyncObjects || (apf.$asyncObjects = {}))["adbg"] = 1;