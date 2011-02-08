var jsDAV_ServerPlugin = require("DAV/plugin").jsDAV_ServerPlugin;
var sys = require("sys");
var Exec = require("child_process").exec;

module.exports = Permission = function(handler) {
    jsDAV_ServerPlugin.call(this, handler);
    
    this.handler = handler;
    
    handler.addEventListener("beforeBind", this.checkPermission.bind(this));
    handler.addEventListener("beforeWriteContent", this.checkPermission.bind(this));
    handler.addEventListener("beforeUnbind", this.checkPermission.bind(this));
    handler.addEventListener("beforeCreateFile", this.checkPermission.bind(this));
};

sys.inherits(Permission, jsDAV_ServerPlugin);

(function() {

    this.checkPermission = function(e) {
        var permissions = this.handler.server.permissions;
        if (!permissions || permissions.dav !== "rw") {
            this.handler.httpResponse.writeHead(403);
            this.handler.httpResponse.end("operation not permitted!");
            e.stop();
        } else {
            e.next();
        }
    };

}).call(Permission.prototype);