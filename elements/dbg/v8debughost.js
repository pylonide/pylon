apf.V8DebugHost = function(hostname, port, o3obj) {
    this.$hostname = hostname;
    this.$port = port;
    this.$o3obj = o3obj;
    
    this.$debugger = null;
    
    this.$init();
};

(function() {
     
    this.$connect = function(callback) {
        var self = this;
        
        if (this.state == "connected") {
            return callback.call(this);
        } else {
            this.addEventListener("connect", function() {
                self.removeEventListener("connect", arguments.callee);
                callback.call(self);
            });
        }
        if (this.state == "connecting")
            return;

        this.state = "connecting";
        
        var socket = this.$socket = new O3Socket(this.$hostname, this.$port, this.$o3obj);
        this.$v8ds = new StandaloneV8DebuggerService(socket);
        
        this.state = "connected";
        this.dispatchEvent("connect");
            
        window.onunload = ace.bind(this.disconnect, this);
        callback.call(this);
    };
    
    this.loadTabs = function(model) {
        model.load("<tabs><tab id='0'>V8</tab></tabs>");
    };
    
    this.attach = function(tabId, callback) {
        var dbg = this.$debugger;
        
        if (dbg)
            callback(null, dbg)

        var self = this;
        this.$connect(function() {
            self.$v8ds.attach(0, function() {
                dbg = new apf.V8Debugger(new V8Debugger(0, self.$v8ds), this);
                self.$debugger = dbg;
                callback(null, dbg);
            });
        });
    };
    
    this.detach = function(dbg, callback) {        
        if (!dbg || this.$debugger !== dbg)
            return callback();
        
        this.$debugger = null;

        var self = this;
        this.$v8ds.detach(0, function(err) {
            dbg.dispatchEvent("detach");
            self.$socket.close();
            self.dispatchEvent("disconnect", {});
            callback && callback(err);
        });                
    };  
    
    this.disconnect = function(callback) {
        this.detach(this.$debugger, callback);
    };
    
}).call(apf.V8DebugHost.prototype = new apf.Class());