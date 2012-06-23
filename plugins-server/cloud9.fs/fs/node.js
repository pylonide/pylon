/*
 * @package jsDAV
 * @subpackage DAV
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax DOT org>
 */
"use strict";

var jsDAV_iNode = require("jsDAV/lib/DAV/iNode").jsDAV_iNode;
var Exc         = require("jsDAV/lib/DAV/exceptions");
var Util        = require("jsDAV/lib/DAV/util");

function jsDAV_FS_Node(vfs, path, stat) {
    this.vfs = vfs;
    this.path = path;
    this.$stat = stat;
}

exports.jsDAV_FS_Node = jsDAV_FS_Node;

(function() {
    /**
     * Returns the name of the node
     *
     * @return {string}
     */
    this.getName = function() {
        return Util.splitPath(this.path)[1];
    };

    /**
     * Renames the node
     *
     * @param {string} name The new name
     * @return void
     */
    this.setName = function(name, callback) {
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
    };

    this._stat = function(path, callback) {
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
                return callback(new Exc.jsDAV_Exception_FileNotFound("File at location "
                    + self.path + " not found"));
            }
            self.$stat = stat;
            callback(null, stat);
        });
    };

    /**
     * Returns the last modification time, as a unix timestamp
     *
     * @return {Number}
     */
    this.getLastModified = function(callback) {
        this._stat(function(err, stat) {
            if (err)
                return callback(err);

            callback(null, stat.mtime);
        });
    };

    /**
     * Returns whether a node exists or not
     *
     * @return {Boolean}
     */
    this.exists = function(callback) {
        this._stat(function(err, stat) {
            return callback(!err && !stat.err);
        });
    };
}).call(jsDAV_FS_Node.prototype = new jsDAV_iNode());
