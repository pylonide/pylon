"use strict";

var jsDAV_FS_Node = require("./node");
var jsDAV_File = require("jsDAV/lib/DAV/file");
var Exc = require("jsDAV/lib/shared/exceptions");
var Util = require("jsDAV/lib/shared/util");

var jsDAV_FS_File = module.exports = jsDAV_FS_Node.extend(jsDAV_File, {
  initialize: function(vfs, path, stat) {
    this.vfs = vfs;
    this.path = path;
    this.$stat = stat;
  },

  /**
   * Updates the data whilst writing to a stream instead of from Buffer objects
   * that reside in memory.
   *
   * @param {mixed} data
   * @return void
   */
  putStream: function(handler, type, callback) {
    var path = this.path;
    // is it a chunked upload?
    var size = handler.httpRequest.headers["x-file-size"];
    if (size && size !== "undefined") {
      var parts = Util.splitPath(this.path);
      if (!handler.httpRequest.headers["x-file-name"])
        handler.httpRequest.headers["x-file-name"] = parts[1];
      handler.server.tree.getNodeForPath(parts[0], function(err, parent) {
        if (err)
          return callback(err);

        parent.writeFileChunk(handler, type, callback);
      });
    }
    else {
      this.vfs.mkfile(path, {}, function(err, meta) {
        if (err) {
          if (err.code == "EACCES")
            err = new Exc.Forbidden("Permission denied to write file:" + path);
          return callback(err);
        }

        handler.getRequestBody(type, meta.stream, false, callback);
      });
    }
  },

  /**
   * Returns the data whilst using a ReadStream so that excessive memory usage
   * is prevented.
   *
   * @return Buffer
   */
  getStream: function(start, end, callback) {
    var options = {};
    if (typeof start == "number" && typeof end == "number")
      options = { start: start, end: end };

    this.vfs.readfile(this.path, options, function(err, meta) {
      if (err)
        return callback(err);

      var stream = meta.stream;

      stream.on("data", function(data) {
        callback(null, data);
      });

      stream.on("error", function(err) {
        callback(err);
      });

      stream.on("end", function() {
        // Invoking the callback without error and data means that the callee
        // can continue handling the request.
        callback();
      });
    });

  },

  /**
   * Delete the current file
   *
   * @return void
   */
  "delete": function(callback) {
    this.vfs.rmfile(this.path, {}, callback);
  },

  /**
   * Returns the size of the node, in bytes
   *
   * @return int
   */
  getSize: function(callback) {
    this._stat(function(err, stat) {
      if (err)
        return callback(err);

      callback(null, stat.size);
    });
  },

  /**
   * Returns the ETag for a file
   * An ETag is a unique identifier representing the current version of the file.
   * If the file changes, the ETag MUST change.
   * Return null if the ETag can not effectively be determined
   *
   * @return mixed
   */
  getETag: function(callback) {
    this._stat(function(err, stat) {
      if (err)
        return callback(err);

      callback(null, stat.etag);
    });
  },

  /**
   * Returns the mime-type for a file
   * If null is returned, we'll assume application/octet-stream
   *
   * @return mixed
   */
  getContentType: function(callback) {
    this._stat(function(err, stat) {
      if (err)
        return callback(err);

      callback(null, stat.mime);
    });
  }
});
