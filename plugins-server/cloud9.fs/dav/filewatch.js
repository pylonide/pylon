var jsDAV_ServerPlugin = require("jsDAV/lib/DAV/plugin");
var util = require("util");
var events = require("events");

var Filewatch = module.exports = function(options) {
    var self = this;
    
    var plugin = jsDAV_ServerPlugin.extend({
      initialize: function(handler) {

        jsDAV_ServerPlugin.new(this, handler);

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
    });

    self.getPlugin = function() {
        return plugin;
    }
};

util.inherits(Filewatch, events.EventEmitter);
