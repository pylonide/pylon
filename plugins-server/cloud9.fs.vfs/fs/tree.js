/*
 * @package jsDAV
 * @subpackage DAV
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax DOT org>
 * @author Mike de Boer <info AT mikedeboer DOT nl>
 * @license http://github.com/mikedeboer/jsDAV/blob/master/LICENSE MIT License
 */
"use strict";

var jsDAV_Tree         = require("jsDAV/lib/DAV/tree").jsDAV_Tree;
var jsDAV_FS_Directory = require("./directory").jsDAV_FS_Directory;
var jsDAV_FS_File      = require("./file").jsDAV_FS_File;

var Async              = require("asyncjs");
var Exc                = require("jsDAV/lib/DAV//exceptions");

/**
 * jsDAV_Tree_Filesystem
 *
 * Creates this tree
 * Supply the path you'd like to share.
 *
 * @param {Object} vfs
 * @contructor
 */
function jsDAV_Tree_Filesystem(vfs, basePath) {
    this.vfs = vfs;
    this.basePath = basePath;
}

exports.jsDAV_Tree_Filesystem = jsDAV_Tree_Filesystem;

(function() {
    /**
     * Returns a new node for the given path
     *
     * @param string path
     * @return void
     */
    this.getNodeForPath = function(path, callback) {
        var self = this;

        this.vfs.stat(path, {}, function(err, stat) {
            if (err)
                return callback(new Exc.jsDAV_Exception_FileNotFound("File at location " + path + " not found 1"));

            callback(null, stat.mime == "inode/directory"
                ? new jsDAV_FS_Directory(self.vfs, path)
                : new jsDAV_FS_File(self.vfs, path)
            );
        });
    };

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
    this.copy = function(source, destination, callback) {
        var self = this;
        this.vfs.stat(source, {}, function(err, stat) {
            if (err)
                return callback(err);

            if (stat.mime === "inode/directory")
                self.vfs.copy(destination, {from: source}, callback);
            else
                // TODO vfs
                Async.copytree(source, destination, callback);
        });
    };

    /**
     * Moves a file or directory recursively.
     *
     * If the destination exists, delete it first.
     *
     * @param string source
     * @param string destination
     * @return void
     */
    this.move = function(source, destination, callback) {
        this.vfs.rename(destination, {from: source}, callback);
    };

}).call(jsDAV_Tree_Filesystem.prototype = new jsDAV_Tree());
