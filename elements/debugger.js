if (apf.hasRequireJS) require.def("apf/elements/debugger",
    [], function() {

apf.dbg = function(struct, tagName){
    this.$init(tagName || "debugger", apf.NODE_HIDDEN, struct);
};

(function(){
    
    this.$host = null;
    this.$debugger = null;
    
    this.$supportedProperties.push("state-running", "state-attached", 
        "model-sources", "model-stacks", "model-breakpoints", "activeframe");
  
    this.$createModelPropHandler = function(name, xml, callback) {
        return function(value) {
            if (!value) return;
            //#ifdef __WITH_NAMESERVER
            this[name] = apf.setReference(value,
                apf.nameserver.register("model", value, new apf.model()));
            
            // set the root node for this model
            this[name].id = this[name].name = value;
            this[name].load(xml);
            //#endif
        }
    };

    this.$createStatePropHandler = function(name) {
        return function(value) {
            if (!value) return;
            //#ifdef __WITH_NAMESERVER
            this[name] = apf.setReference(value,
                    apf.nameserver.register("state", value, new apf.state()));
            
            // set the root node for this model
            this[name].id = this[name].name = value;
            this[name].deactivate();
            //#endif
        }
    };
    
    this.$propHandlers["model-sources"] = this.$createModelPropHandler("$mdlSources", "<sources />");
    this.$propHandlers["model-stack"] = this.$createModelPropHandler("$mdlStack", "<frames />");
    this.$propHandlers["model-breakpoints"] = this.$createModelPropHandler("$mdlBreakpoints", "<breakpoints />");

    this.$propHandlers["state-running"] = this.$createStatePropHandler("$stRunning");
    this.$propHandlers["state-attached"] = this.$createStatePropHandler("$stAttached");
    
    this.$propHandlers["activeframe"] = function(value) {
        if (this.$debugger) {
            this.$ignoreFrameEvent = true;
            this.$debugger.setFrame(value);
            this.$ignoreFrameEvent = false;
        }
        this.dispatchEvent("changeframe", {data: value});
    };

    this.attach = function(host, tab) {
        var self = this;

        host.$attach(this, tab, function(err, dbgImpl) {
            self.$host = host;
            self.$debugger = dbgImpl;
            dbgImpl.addEventListener("afterCompile", self.$onAfterCompile.bind(self));
            
            self.$stAttached.activate();
            self.$stRunning.setProperty("active", dbgImpl.isRunning());
            
            self.$loadSources();
            
            dbgImpl.addEventListener("changeRunning", self.$onChangeRunning.bind(self));
            dbgImpl.addEventListener("break", self.$onBreak.bind(self));
            dbgImpl.addEventListener("detach", self.$onDetach.bind(self));
            dbgImpl.addEventListener("changeFrame", self.$onChangeFrame.bind(self));
            
            dbgImpl.setBreakpoints(self.$mdlBreakpoints); 
        });
    };
    
    this.$onChangeRunning = function() {
        var isRunning = this.$debugger.isRunning();
        if (this.$stRunning.active && !isRunning)
            this.$onBreak();
        
        this.$stRunning.setProperty("active", isRunning);
        
        if (isRunning)
            this.$mdlStack.load("<frames />");
    };
    
    this.$onBreak = function() {
        var _self = this;
        this.$debugger.backtrace(this.$mdlStack, function() {
            _self.dispatchEvent("break");
        });
    };
    
    this.$onAfterCompile = function(e) {
        var id = e.script.getAttribute("id");
        var oldNode = this.$mdlSources.queryNode("//file[@id='" + id + "']");
        if (oldNode)
            this.$mdlSources.removeXml(oldNode);
        this.$mdlSources.appendXml(e.script);
    };
    
    this.$onDetach = function() {
        this.$debugger.destroy();
        this.$debugger = null;
        
        this.$host = null;
        
        this.$mdlSources.load("<sources />");
        this.$mdlStack.load("<frames />");
        this.$stAttached.deactivate();
    };   

    this.$onChangeFrame = function() {
        if (!this.$ignoreFrameEvent) {
            this.setProperty("activeframe", this.$debugger.getActiveFrame());
        }
    };
    
    this.changeFrame = function(frame) {
        this.$debugger.setFrame(frame);
    };
    
    this.detach = function(callback) {
        var self = this;
        this.continueScript(function() {
            self.$host.$detach(self.$debugger, callback);
        });
    };

    this.$loadSources = function(callback) {
        this.$debugger.scripts(this.$mdlSources, callback);        
    };
    
    this.loadScript = function(script, callback) {
        this.$debugger.loadScript(script, callback);
    };

    this.loadObjects = function(item, callback) {
        this.$debugger.loadObjects(item, callback);
    };
    
    this.loadFrame = function(frame, callback) {
        this.$debugger.loadFrame(frame, callback);
    };
    
    this.toggleBreakpoint = function(script, row) {
        this.$debugger.toggleBreakpoint(script, row, this.$mdlBreakpoints);
    };

    this.continueScript = function() {
        this.$debugger && this.$debugger.continueScript();
    };

    this.stepInto = function() {
        this.$debugger && this.$debugger.stepInto();
    };

    this.stepNext = function() {
        this.$debugger && this.$debugger.stepNext();
    };

    this.stepOut = function() {
        this.$debugger && this.$debugger.stepOut();
    };    

    this.suspend = function() {
        this.$debugger && this.$debugger.suspend();
    };
    
    this.evaluate = function(expression, frame, global, disableBreak, callback){
        this.$debugger && this.$debugger.evaluate(expression, frame, global, disableBreak, callback);
    }
    
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
//                     callback("<file>" + apf.escapeXML(source) + "</file>", apf.SUCCESS);
                     //TODO: ugly text() bug workaround
                     callback("<file><![CDATA[" + source.replace("]]>", "]] >") + "]]></file>", apf.SUCCESS);
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
         else if (method == "loadFrame") {
             var dbg = args[0];
             var frame = args[1];
             
             dbg.loadFrame(frame, function(xml) {
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

return apf.dbg;
});