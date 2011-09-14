var jsDAV_ServerPlugin = require("DAV/plugin").jsDAV_ServerPlugin;
var sys = require("sys");
var Exec = require("child_process").exec;

module.exports = Permission = function(handler) {
    jsDAV_ServerPlugin.call(this, handler);
    
    this.handler = handler;
    handler.addEventListener("beforeMethod", this.checkPermission.bind(this));
};

sys.inherits(Permission, jsDAV_ServerPlugin);

(function() {

    this.READ_METHODS = {
        "OPTIONS":1,
        "GET":1,
        "HEAD":1,
        "PROPFIND":1,
        "REPORT":1
    };
    
    this.WRITE_METHODS = {
        "DELETE":1,
        "MKCOL":1,
        "PUT":1,
        "PROPPATCH":1,
        "COPY":1,
        "MOVE":1,
        "LOCK":1,
        "UNLOCK":1
    };

    this.checkPermission = function(e, method) {
        var permissions = this.handler.server.permissions;
        
        if (!permissions)
            return e.next();
            
        if (this.READ_METHODS[method] && permissions.dav.indexOf("r") > -1)
            return e.next();
            
        if (this.WRITE_METHODS[method] && permissions.dav.indexOf("w") > -1)
            return e.next();
            
        this.handler.httpResponse.writeHead(403);
        this.handler.httpResponse.end("operation not permitted!");
        e.stop();
    };

}).call(Permission.prototype);