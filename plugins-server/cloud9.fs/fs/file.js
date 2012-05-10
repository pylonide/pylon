"use strict";

var jsDAV_FS_Node   = require("./node").jsDAV_FS_Node;
var jsDAV_iFile     = require("jsDAV/lib/DAV/iFile").jsDAV_iFile;

var Exc             = require("jsDAV/lib/DAV/exceptions");
var Util            = require("jsDAV/lib/DAV/util");

function jsDAV_FS_File(vfs, path) {
    this.vfs = vfs;
    this.path = path;
}

exports.jsDAV_FS_File = jsDAV_FS_File;

(function() {
    this.implement(jsDAV_iFile);

    /**
     * Updates the data whilst writing to a stream instead of from Buffer objects
     * that reside in memory.
     *
     * @param {mixed} data
     * @return void
     */
    this.putStream = function(handler, type, cbfsput) {
        var path = this.path;
        // is it a chunked upload?
        var size = handler.httpRequest.headers["x-file-size"];
        if (size) {
            var parts = Util.splitPath(this.path);
            if (!handler.httpRequest.headers["x-file-name"])
                handler.httpRequest.headers["x-file-name"] = parts[1];
            handler.server.tree.getNodeForPath(parts[0], function(err, parent) {
                if (!Util.empty(err))
                    return cbfsput(err);

                parent.writeFileChunk(handler, type, cbfsput);
            });
        }
        else {
            this.vfs.mkfile(path, {}, function(err, meta) {
                handler.getRequestBody(type, meta.stream, cbfsput);
            });
        }
    };

    /**
     * Returns the data whilst using a ReadStream so that excessive memory usage
     * is prevented.
     *
     * @return Buffer
     */
    this.getStream = function(start, end, cbfsfileget) {
        var options = {};
        if (typeof start == "number" && typeof end == "number")
            options = { start: start, end: end };

        this.vfs.readfile(this.path, options, function(err, meta) {
            var stream = meta.stream;

            stream.on("data", function(data) {
                cbfsfileget(null, data);
            });

            stream.on("error", function(err) {
                cbfsfileget(err);
            });

            stream.on("end", function() {
                // Invoking the callback without error and data means that the callee
                // can continue handling the request.
                cbfsfileget();
            });
        });

    };

    /**
     * Delete the current file
     *
     * @return void
     */
    this["delete"] = function(callback) {
        this.vfs.rmfile(this.path, {}, callback);
    };

    this._stat = function(callback) {
        var self = this;
        return this.vfs.stat(this.path, {}, function(err, stat) {
            if (err || !stat) {
                return callback(new Exc.jsDAV_Exception_FileNotFound("File at location "
                    + self.path + " not found"));
            }
            self.$stat = stat;
            callback(null, stat);
        });
    };

    /**
     * Returns the size of the node, in bytes
     *
     * @return int
     */
    this.getSize = function(callback) {
        this._stat(function(err, stat) {
            if (err)
                return callback(err);

            callback(null, stat.size);
        });
    };

    /**
     * Returns the ETag for a file
     * An ETag is a unique identifier representing the current version of the file.
     * If the file changes, the ETag MUST change.
     * Return null if the ETag can not effectively be determined
     *
     * @return mixed
     */
    this.getETag = function(callback) {
        this._stat(function(err, stat) {
            if (err)
                return callback(err);

            callback(null, stat.etag);
        });
    };

    /**
     * Returns the mime-type for a file
     * If null is returned, we'll assume application/octet-stream
     *
     * @return mixed
     */
    this.getContentType = function(callback) {
        this._stat(function(err, stat) {
            if (err)
                return callback(err);

            callback(null, stat.mime);
        });
    };
}).call(jsDAV_FS_File.prototype = new jsDAV_FS_Node());
