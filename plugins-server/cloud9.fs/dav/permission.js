var jsDAV_ServerPlugin = require("cozy-jsdav-fork/lib/DAV/plugin");
var util = require("util");

var Permission = module.exports = jsDAV_ServerPlugin.extend({
  /**
   * Plugin name
   *
   * @var String
   */
  name: "permission",

  initialize: function(handler) {
    jsDAV_ServerPlugin.new(this, handler);

    this.handler = handler;
    handler.addEventListener("beforeMethod", this.checkPermission.bind(this));
  },

  READ_METHODS: {
    "OPTIONS":1,
    "GET":1,
    "HEAD":1,
    "PROPFIND":1,
    "REPORT":1
  },

  WRITE_METHODS: {
    "DELETE":1,
    "MKCOL":1,
    "PUT":1,
    "PROPPATCH":1,
    "COPY":1,
    "MOVE":1,
    "LOCK":1,
    "UNLOCK":1
  },

  checkPermission: function(e, method) {
    var permissions = this.handler.server.permissions;

    if (typeof permissions == "string") {
      if (this.READ_METHODS[method] && permissions.indexOf("r") > -1)
        return e.next();

      if (this.WRITE_METHODS[method] && permissions.indexOf("w") > -1)
        return e.next();
    }

    this.handler.httpResponse.writeHead(403);
    this.handler.httpResponse.end("operation not permitted!");
    e.stop();
  }

});