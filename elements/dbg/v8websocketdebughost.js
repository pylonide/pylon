// #ifdef __AMLDEBUGGER || __INC_ALL
if (apf.hasRequireJS) define("apf/elements/dbg/v8websocketdebughost",
    ["module",
     "debug/WSV8DebuggerService",
     "debug/V8Debugger",
     "apf/elements/dbg/v8debugger"],
    function(module, WSV8DebuggerService, V8Debugger, APFV8Debugger) {

var V8WebSocketDebugHost = module.exports = function(socket) {
    this.$socket = socket;
    this.$debugger = null;
    
    this.$init();
};

(function() {
     
    this.$connect = function(callback) {
        if (this.state != "connected")
            this.$v8ds = new WSV8DebuggerService(this.$socket);
        
        this.state = "connected";
        this.dispatchEvent("connect");
        callback.call(this);
    };
    
    this.loadTabs = function(model) {
        model.load("<tabs><tab id='0'>V8</tab></tabs>");
    };
    
    this.attach = function(tabId, callback) {
        var dbg = this.$debugger;
        
        if (dbg)
            return callback(null, dbg)

        var self = this;
        this.$connect(function() {
            self.$v8ds.attach(0, function() {
                dbg = new APFV8Debugger(new V8Debugger(0, self.$v8ds), this);
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
            self.dispatchEvent("disconnect", {});
            callback && callback(err);
        });                
    };  
    
    this.disconnect = function(callback) {
        this.detach(this.$debugger, callback);
    };
    
}).call(V8WebSocketDebugHost.prototype = new apf.Class());

});
// #endif
