/*
 * @package jsDAV
 * @subpackage DAV
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax DOT org>
 */
"use strict";

var jsDAV_iNode = require("cozy-jsdav-fork/lib/DAV/interfaces/iNode");
var Exc         = require("cozy-jsdav-fork/lib/shared/exceptions");
var Util        = require("cozy-jsdav-fork/lib/shared/util");

var jsDAV_FS_Node = module.exports = jsDAV_iNode.extend({
  initialize: function(vfs, path, stat) {
    this.vfs = vfs;
    this.path = path;
    this.$stat = stat;
  },

  /**
   * Returns the name of the node
   *
   * @return {string}
   */
  getName: function() {
    return Util.splitPath(this.path)[1];
  },

  /**
   * Renames the node
   *
   * @param {string} name The new name
   * @return void
   */
  setName: function(name, callback) {
    var parentPath = Util.splitPath(this.path)[0];
    var newName    = Util.splitPath(name)[1];

    var newPath = parentPath + "/" + newName;
    var self = this;
    this.vfs.rename(newPath, {from: this.path}, function(err) {
      if (err)
        return callback(err);
      self.path = newPath;
      callback();
    });
  },

  _stat: function(path, callback) {
    var self = this;

    if (!callback) {
      callback = path;
      path = this.path;

      if (this.$stat)
        return callback(null, this.$stat);
    }

    this.vfs.stat(path, {}, function(err, stat) {
      console.log("stat", err, stat);
      if (err || !stat) {
        return callback(new Exc.FileNotFound("File at location "
                        + self.path + " not found"));
      }
      self.$stat = stat;
      callback(null, stat);
    });
  },

  /**
   * Returns the last modification time, as a unix timestamp
   *
   * @return {Number}
   */
  getLastModified: function(callback) {
    this._stat(function(err, stat) {
      if (err)
        return callback(err);

      callback(null, stat.mtime);
    });
  },

  /**
   * Returns whether a node exists or not
   *
   * @return {Boolean}
   */
  exists: function(callback) {
    this._stat(function(err, stat) {
      return callback(!err && !stat.err);
    });
  }
});
