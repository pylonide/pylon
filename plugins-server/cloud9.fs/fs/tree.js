/*
 * @package jsDAV
 * @subpackage DAV
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax DOT org>
 */
"use strict";

var jsDAV_Tree = require("jsDAV/lib/DAV/tree");
var jsDAV_FS_Directory = require("./directory");
var jsDAV_FS_File = require("./file");

var Exc = require("jsDAV/lib/shared/exceptions");
var Path = require("path");


/**
 * jsDAV_Tree_Filesystem
 *
 * Creates this tree
 * Supply the path you'd like to share.
 *
 * @param {Object} vfs
 * @contructor
 */
var jsDAV_Tree_Filesystem = module.exports = jsDAV_Tree.extend({
  initialize: function(vfs, basePath) {
    this.vfs = vfs;
    this.basePath = basePath || "";
  },

  /**
   * Returns a new node for the given path
   *
   * @param string path
   * @return void
   */
  getNodeForPath: function(path, callback) {
    var self = this;
    path = this.getRealPath(path);
    var nicePath = this.stripSandbox(path);
    if (!this.insideSandbox(path))
      return callback(new Exc.jsDAV_Exception_Forbidden("You are not allowed to access " + nicePath));

    this.vfs.stat(path, {}, function(err, stat) {
      if (err)
        return callback(new Exc.jsDAV_Exception_FileNotFound("File at location " + path + " not found"));

      callback(null, stat.mime == "inode/directory"
                ? jsDAV_FS_Directory.new(self.vfs, path, stat)
                : jsDAV_FS_File.new(self.vfs, path, stat)
              );
    });
  },

  /**
   * Returns the real filesystem path for a webdav url.
   *
   * @param string publicPath
   * @return string
   */
  getRealPath: function(publicPath) {
    // if we already start with the basepath, let it go :-)
    if (publicPath.indexOf(this.basePath) === 0) {
      return publicPath;
    }

    return Path.join(this.basePath, publicPath);
  },

  /**
   * Copies a file or directory.
   *
   * This method must work recursively and delete the destination
   * if it exists
   *
   * @param string source
   * @param string destination
   * @return void
   */
  copy: function(source, destination, callback) {
    var self = this;
    source = this.getRealPath(source);
    destination = this.getRealPath(destination);
    if (!this.insideSandbox(destination)) {
      return callback(new Exc.jsDAV_Exception_Forbidden("You are not allowed to copy to " +
                      this.stripSandbox(destination)));
    }

    // first check if source exists
    this.vfs.stat(source, {}, function(err, stat) {
      if (err || stat.err)
        return callback(err);

      // if destination exists try to delete it
      self.vfs.rmdir(destination, { recursive: true }, function(err) {
        // ignore error because destination may not exists
        self.vfs.execFile("cp", {args: ["-R", source, destination]}, callback);
      });
    });
  },

  /**
   * Moves a file or directory recursively.
   *
   * If the destination exists, delete it first.
   *
   * @param string source
   * @param string destination
   * @return void
   */
  move: function(source, destination, callback) {
    source = this.getRealPath(source);
    destination = this.getRealPath(destination);
    if (!this.insideSandbox(destination)) {
      return callback(new Exc.jsDAV_Exception_Forbidden("You are not allowed to move to " +
        this.stripSandbox(destination)));
    }

    this.vfs.rename(destination, {from: source}, callback);
  }
});
