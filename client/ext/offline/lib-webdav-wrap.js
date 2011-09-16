/**
 * Offline Support for Cloud9
 *
 * @copyright 2011, Ajax.org B.V.
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");

var WebdavHtml5FileSystem = require("ext/offline/lib-offlinedav");
var WebdavLocalStorage = require("ext/offline/lib-offlinels");

/**
 * Create the webdav wrapper, if we have a real webdav object we'll be
 * saving remotely, otherwise we'll save locally
 */
var WebdavWrapper = module.exports = function(webdav, sync, fIdent, callback) {
    this.realWebdav    = webdav;
    
    // Check Local filesystem is available, or use localStorage
    this.hasFileSystem = WebdavHtml5FileSystem.isAvailable()  && false; //@todo this has to be changed when bgsync is 100% working
    if (this.hasFileSystem)
        this.localWebdav = new WebdavHtml5FileSystem(callback, sync);
    else
        this.localWebdav = new WebdavLocalStorage(callback, sync, fIdent);
};

(function() {
    this.available = true;
    this.fake      = true;
    
    /**
     * Check a file exists in the path
     */
    this.exists = function(path, callback) {
        if (ide.onLine)
            this.realWebdav.exists.apply(this.realWebdav, arguments);
        else if (this.hasFileSystem)
            this.localWebdav.exists.apply(this.localWebdav, arguments);
        else
            callback(null, apf.OFFLINE, {});
    };
    
    /**
    * Read function here currently takes in content as a string,
    * we probably want to do some MIME checking here for binary
    * files
    */
    this.read = function(path, callback){
        if (ide.onLine)
            this.realWebdav.read.apply(this.realWebdav, arguments);
        else if (this.hasFileSystem)
            this.localWebdav.read.apply(this.localWebdav, arguments);
        else
            callback(null, apf.OFFLINE, {});
    };
    /**
     * Here we write the file to the file system, then we also
     * need to add it to the sync operations for that file
     * when we go online
     * 
     * With write, if the project is syned, we also want to write offline
     * as well as offline, but if we are offline we only write to offline
     */
    this.writeFile =
    this.write     = function(path, data, x, callback){
        if (ide.onLine)
            this.realWebdav.write.apply(this.realWebdav, arguments);
        
        this.localWebdav.write.call(this.localWebdav, path, data, x, ide.onLine ? apf.K : callback);
    };
    
    /**
     * Remove a file from the filesystem.  If we are online and the project
     * is syned, we write to both online and offline, if we are offline we
     * only write to offline
     */
    this.remove = function(sPath, bLock, callback) {
        if (ide.onLine)
            this.realWebdav.remove.apply(this.realWebdav, arguments);
        
        this.localWebdav.remove.call(this.localWebdav, sPath, bLock, ide.onLine ? apf.K : callback);
    }
    
    /**
     * Copy a file from the filesystem.  If we are online and the project
     * is syned, we write to both online and offline, if we are offline we
     * only write to offline
     */
    this.copy = function(sFrom, sTo, bOverwrite, bLock, callback) {
        if (ide.onLine)
            this.realWebdav.copy.apply(this.realWebdav, arguments);
        
        this.localWebdav.copy.call(this.localWebdav, sFrom, sTo, bOverwrite, bLock, ide.onLine ? apf.K : callback);
    }
    
    /**
     * Rename or move a file from the filesystem.  If we are online and the project
     * is syned, we write to both online and offline, if we are offline we
     * only write to offline
     */
    this.rename =
    this.move = function(sFrom, sTo, bOverwrite, bLock, callback) {
        if (ide.onLine)
            this.realWebdav.move.apply(this.realWebdav, arguments);
        
        this.localWebdav.move.call(this.localWebdav, sFrom, sTo, bOverwrite, bLock, ide.onLine ? apf.K : callback);
    }
    
    this.report = function(sPath, reportName, oProperties, callback) {
        //if (ide.onLine)
            this.realWebdav.report.apply(this.realWebdav, arguments);
    }
    
    this.getProperties = function(sPath, iDepth, callback, oHeaders) {
    }
    
    this.setProperties = function(sPath, oPropsSet, oPropsDel, sLock) {
    }
    
    /**
     * method to do a ls on a directory, this returns
     * an array of FileEntry and DirectoryEntry objects
     * which can be itterated over to generate
     * a tree path
     */
    this.list = function(path, callback){
        if (ide.onLine)
            this.realWebdav.list.apply(this.realWebdav, arguments);
        else if (this.hasFileSystem)
            this.localWebdav.list.apply(this.localWebdav, arguments);
        else
            throw new Error("You are currently offline and the local filesystem is unavailable");
    };
    this.exec = function(type, args, callback) {
        if (ide.onLine)
            this.realWebdav.exec.apply(this.realWebdav, arguments);
        this.localWebdav.exec.call(this.localWebdav, type, args, ide.onLine ? apf.K : callback);
    };
    
    this.handleError = function(callback, error) {
        callback(null, apf.ERROR, error ? {message: error.code} : {});
    }
}).call(WebdavWrapper.prototype = new apf.Class().$init());

});
