var jsDAV_ServerPlugin = require("jsDAV/lib/DAV/plugin").jsDAV_ServerPlugin;
var util = require("util");
var events = require("events");

var Filewatch = module.exports = function(options) {
    var self = this;
    
    var plugin = function(handler) {

        jsDAV_ServerPlugin.call(this, handler);

        handler.addEventListener("afterWriteContent", function(e, uri) {
            self.emit("afterWrite", {
                file: "/" + uri
            });
            e.next();
        });

        handler.addEventListener("afterDelete", function(e, uri) {
            self.emit("afterDelete", {
                file: "/" + uri
            });
            e.next();
        });
        
        handler.addEventListener("afterMove", function(e, uri) {
            self.emit("afterMove", {
                file: "/" + uri
            });
            e.next();
        });
        
        handler.addEventListener("afterCopy", function(e, uri) {
            self.emit("afterCopy", {
                file: "/" + uri
            });
            e.next();
        });
    }
    util.inherits(plugin, jsDAV_ServerPlugin);

    self.getPlugin = function() {
        return plugin;
    }
};

util.inherits(Filewatch, events.EventEmitter);
