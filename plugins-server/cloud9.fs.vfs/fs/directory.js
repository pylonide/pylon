/*
 * @package jsDAV
 * @subpackage DAV
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax DOT org>
 * @author Mike de Boer <info AT mikedeboer DOT nl>
 * @license http://github.com/mikedeboer/jsDAV/blob/master/LICENSE MIT License
 */
"use strict";

var jsDAV_FS_Node     = require("./node").jsDAV_FS_Node;
var jsDAV_FS_File     = require("./file").jsDAV_FS_File;
var jsDAV_Directory   = require("jsDAV/lib/DAV/directory").jsDAV_Directory;
var jsDAV_iCollection = require("jsDAV/lib/DAV/iCollection").jsDAV_iCollection;
var jsDAV_iQuota      = require("jsDAV/lib/DAV/iQuota").jsDAV_iQuota;

var Fs                = require("fs");
var Path              = require("path");
var Exc               = require("jsDAV/lib/DAV/exceptions");
var Util              = require("jsDAV/lib/DAV/util");

function jsDAV_FS_Directory(vfs, path) {
    this.vfs = vfs;
    this.path = path;
}

exports.jsDAV_FS_Directory = jsDAV_FS_Directory;

(function() {
    this.implement(jsDAV_Directory, jsDAV_iCollection, jsDAV_iQuota);

    /**
     * Creates a new file in the directory whilst writing to a stream instead of
     * from Buffer objects that reside in memory.
     *
     * @param string name Name of the file
     * @param resource data Initial payload
     * @param {String} [enc]
     * @param {Function} cbfscreatefile
     * @return void
     */
    this.createFileStream = function(handler, name, enc, cbfscreatefile) {
        // is it a chunked upload?
        var size = handler.httpRequest.headers["x-file-size"];
        if (size) {
            if (!handler.httpRequest.headers["x-file-name"])
                handler.httpRequest.headers["x-file-name"] = name;
            this.writeFileChunk(handler, enc, cbfscreatefile);
        }
        else {
            var newPath = this.path + "/" + name;
            var stream = Fs.createWriteStream(newPath, {
                encoding: enc
            });
            handler.getRequestBody(enc, stream, cbfscreatefile);
        }
    };

    this.writeFileChunk = function(handler, type, cbfswritechunk) {
        var size = handler.httpRequest.headers["x-file-size"];
        if (!size)
            return cbfswritechunk("Invalid chunked file upload, the X-File-Size header is required.");
        var self = this;
        var filename = handler.httpRequest.headers["x-file-name"];
        var path = this.path + "/" + filename;
        var track = handler.server.chunkedUploads[path];
        if (!track) {
            track = handler.server.chunkedUploads[path] = {
                path: handler.server.tmpDir + "/" + Util.uuid(),
                filename: filename,
                timeout: null
            };
        }
        clearTimeout(track.timeout);
        path = track.path;
        // if it takes more than ten minutes for the next chunk to
        // arrive, remove the temp file and consider this a failed upload.
        track.timeout = setTimeout(function() {
            delete handler.server.chunkedUploads[path];
            Fs.unlink(path, function() {});
        }, 600000); //10 minutes timeout

        var stream = Fs.createWriteStream(path, {
            encoding: type,
            flags: "a"
        });

        stream.on("close", function() {
            Fs.stat(path, function(err, stat) {
                if (err)
                    return;

                if (stat.size === parseInt(size, 10)) {
                    delete handler.server.chunkedUploads[path];
                    Util.move(path, self.path + "/" + filename, true, function(err) {
                        if (err)
                            return;
                        handler.dispatchEvent("afterBind", handler.httpRequest.url,
                            self.path + "/" + filename);
                    });
                }
            });
        })

        handler.getRequestBody(type, stream, cbfswritechunk);
    };

    /**
     * Creates a new subdirectory
     *
     * @param string name
     * @return void
     */
    this.createDirectory = function(name, cbfscreatedir) {
        var newPath = this.path + "/" + name;
        Fs.mkdir(newPath, "0755", cbfscreatedir);
    };

    /**
     * Returns a specific child node, referenced by its name
     *
     * @param string name
     * @throws Sabre_DAV_Exception_FileNotFound
     * @return Sabre_DAV_INode
     */
    this.getChild = function(name, callback) {
        var self = this;
        var path = Path.join(this.path, name);

        this.vfs.stat(path, {}, function(err, meta) {
            if (err)
                return callback(new Exc.jsDAV_Exception_FileNotFound("File at location " + path + " not found"));

            callback(null, meta.stat.mime == "inode/directory"
                ? new jsDAV_FS_Directory(self.vfs, path)
                : new jsDAV_FS_File(self.vfs, path)
            );
        });
    };

    /**
     * Returns an array with all the child nodes
     *
     * @return Sabre_DAV_INode[]
     */
    this.getChildren = function(callback) {
        var self = this;

        this.vfs.readdir(this.path, {}, function(err, meta) {
            if (err)
                return callback(err);

            var stream = meta.stream;
            var ls = "";
            stream.on("data", function(data) {
                ls += data;
            });

            stream.on("end", function() {
                try {
                    ls = JSON.parse(ls);
                } catch(e) {
                    return callback(e);
                }

                var nodes = ls.map(function(file) {
                    var path = Path.join(self.path, file.name);
                    return file.mime === "inode/directory"
                        ? new jsDAV_FS_Directory(self.vfs, path)
                        : new jsDAV_FS_File(self.vfs, path)
                });
                callback(null, nodes);
            });
        });
    };

    /**
     * Deletes all files in this directory, and then itself
     *
     * @return void
     */
    this["delete"] = function(callback) {
        this.vfs.unlink
        callback(new Error("DELETE is not implemented"));
        //Async.rmtree(this.path, callback);
    };

    /**
     * Returns available diskspace information
     *
     * @return array
     */
    this.getQuotaInfo = function(callback) {
        return callback(null, [0, 0]);
    };

}).call(jsDAV_FS_Directory.prototype = new jsDAV_FS_Node());
