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

var Fs                 = require("fs");
var Async              = require("asyncjs");
var Util               = require("jsDAV/lib/DAV/util");
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

        this.vfs.stat(path, {}, function(err, meta) {
            if (err)
                return callback(new Exc.jsDAV_Exception_FileNotFound("File at location " + path + " not found 1"));

            callback(null, meta.stat.mime == "inode/directory"
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
    this.copy = function(source, destination, cbfscopy) {
        //this.realCopy(source, destination, cbfscopy);
    };

    /**
     * Used by self::copy
     *
     * @param string source
     * @param string destination
     * @return void
     */
    this.realCopy = function(source, destination, cbfsrcopy) {
        Fs.stat(source, function(err, stat) {
            if (!Util.empty(err))
                return cbfsrcopy(err);
            if (stat.isFile())
                Async.copyfile(source, destination, true, cbfsrcopy);
            else
                Async.copytree(source, destination, cbfsrcopy);
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
    this.move = function(source, destination, cbfsmove) {
        //Fs.rename(source, destination, cbfsmove);
    };
}).call(jsDAV_Tree_Filesystem.prototype = new jsDAV_Tree());
