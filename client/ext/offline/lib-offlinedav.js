/**
 * Offline Support for Cloud9
 *
 * @copyright 2011, Ajax.org B.V.
 */

define(function(require, exports, module) {

var ide                 = require('core/ide');
var OfflineFileSystem   = require("ext/offline/lib-offlinefs");

var WebdavHtml5FileSystem = module.exports = function(callback, sync) {
    var _self   = this;
    this.sync   = sync;
    this.fs     = new OfflineFileSystem();
    
    this.fs.setFileSystem(this.fs.PERSISTENT, 1024, function(error, webfs){
        if (error)
            console.log(error);
        
        _self.webfs = webfs;
        _self.offlinefs = webfs.fs;
        _self.offlineroot = webfs.root;
        
        _self.loaded    = true;
        callback.apply(window, arguments);
        _self.emptyQueue();
    });
};

WebdavHtml5FileSystem.isAvailable = function(){
    return !!window.requestFileSystem;
};

(function() {
    this.available = true;
    this.fake      = true;
    
    this.$queue = [];
    this.queue = function(method, args) {
        this.$queue.push([method, args]);
    };
    this.emptyQueue = function() {
        var _self = this;
        this.$queue.each(function(item) {
            item[0].apply(_self, item[1]);
        });
        this.$queue = [];
    };
    
    
    this.exists = function(path, callback) {
        if (!this.loaded)
            return this.queue(this.exists, arguments);
        var new_path = path.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this;
        
        this.webfs.open(new_path, 'r', function(error, handler) {
            if (error)
                callback(false);
            else
                callback(true);
        });
    };
    
    
    /**
    * Read function here currently takes in content as a string,
    * we probably want to do some MIME checking here for binary
    * files
    */
    this.read = function(path, callback){
        if (!this.loaded)
            return this.queue(this.read, arguments);
            
        var new_path = path.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this;
        this.webfs.readFile(new_path, function(error, read, buffer) {
            if (error)
                return _self.handleError(callback, error);
            
            _self.webfs.readString(buffer, function(error, data) {
                if (error)
                    return _self.handleError(callback, error);
                callback(data, apf.SUCCESS, {});    
            });
        });
        /*
        if (localStorage[fIdent]) {
            var files = JSON.parse(localStorage[fIdent]);
            if (files[path])
                return callback(files[path], apf.SUCCESS, {});
        }
        this.handleError(callback);
        */
    };
    /**
     * Here we write the file to the file system, then we also
     * need to add it to the sync operations for that file
     * when we go online
     */
    this.writeFile = 
    this.write     = function(path, data, x, callback){
        if (!this.loaded)
            return this.queue(this.write, arguments);

        var new_path = path.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this;
        
        this.webfs.writeFile(new_path, data, function(error, buffer) {
            if (error)
                return _self.handleError(callback, error);
                
            _self.sync.add(path, {
                type: "webdav-write",
                date: new Date().getTime(),
                path: path,
                data: data
            });
            callback(data, apf.SUCCESS, {});
        });
    };
    /**
     * method to do a ls on a directory, this returns
     * an array of FileEntry and DirectoryEntry objects
     * which can be itterated over to generate
     * a tree path
     */
    this.readdir = 
    this.scandir = 
    this.list    = function(path, callback){
        if (!this.loaded)
            return this.queue(this.list, arguments);
        
        var new_path = path.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this,
            name_array,
            name;
        this.webfs.readdir(new_path, function(error, items) {
            if (error)
                return _self.handleError(callback, error);
                
            var output = [];
            var total = 0;
            
            var handleOpen = function(error, handler) {
                if (error)
                    return;
                    
                if (handler.isDirectory) {
                    output.push('<folder path="' + handler.fullPath.replace(new RegExp('^\\/' + ide.projectName), ide.davPrefix) + '"  type="folder" size="0" name="' + handler.name + '" contenttype="" modifieddate="" creationdate="" lockable="false" hidden="false" executable="false" />');
                } else if (handler.isFile) {
                    output.push('<file path="' + handler.fullPath.replace(new RegExp('^\\/' + ide.projectName), ide.davPrefix) + '"  type="file" size="" name="' + handler.name + '" contenttype="" modifieddate="" creationdate="" lockable="false" hidden="false" executable="false" />');
                }
                
                total++;
                
                if (total == items.length) {
                    callback('<files>' + output.join('\n') + '</files>', apf.SUCCESS, {});
                }
            };
            
            for (var i = 0, j = items.length; i < j; i++) {
                var item = items[i];
                _self.webfs.open(item, handleOpen);
            }
        });
    };
    
    this.rename =
    this.move = function(sFrom, sTo, bOverwrite, bLock, callback) {
        if (!this.loaded)
            return this.queue(this.move, arguments);
            
        var new_from = sFrom.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var new_to = sTo.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this;
        
        this.webfs.rename(new_from, new_to, function(error, newDirEntry) {
            if (error)
                return _self.handleError(callback, error);
            _self.sync.add(sFrom, {
                type: "webdav-move",
                date: new Date().getTime(),
                path: sFrom,
                data: sTo
            });
            callback("", apf.SUCCESS, {});
        });
    };
    
    //@todo move stuff from exec
    this.mkdir = function(sPath, bLock, callback) {
        var new_path = sPath.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        
        this.webfs.mkdir(new_path, function(error, directory) {
            if (error)
                return _self.handleError(callback, error);
            _self.sync.add(sPath, {
                type: "webdav-mkdir",
                date: new Date().getTime(),
                path: sPath,
                data: null
            });
           callback("", apf.SUCCESS, {});
        });
    };
    
    //@todo test this
    this.remove = function(sPath, bLock, callback) {
        if (!this.loaded)
            return this.queue(this.remove, arguments);
        var new_path = sPath.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this;
        
        this.webfs.unlink(new_path, function(error) {
            if (error)
                return _self.handleError(callback, error);
            _self.sync.add(sPath, {
                    type: "webdav-remove",
                    date: new Date().getTime(),
                    path: sPath
                });
                callback("", apf.SUCCESS, {});
        });
    };
    
    //@todo
    this.copy = function(sFrom, sTo, bOverwrite, bLock, callback) {
        if (!this.loaded)
            return this.queue(this.move, arguments);
        var new_from = sFrom.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var new_to = sTo.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this;
        
        this.webfs.copy(new_from, new_to, function(error, newDirEntry) {
            if (error)
                return _self.handleError(callback, error);
            _self.sync.add(sFrom, {
                type: "webdav-move",
                date: new Date().getTime(),
                path: sFrom,
                data: sTo
            });
            callback("", apf.SUCCESS, {});
        });
    };
    
    //@todo fix double entries (move implementations to functions - Watch out for different arguments!!)
    this.exec = function(type, args, cb) {
        if (!this.loaded)
            return this.queue(this.exec, arguments);
        
        var _self = this,
            ful_path;
        switch(type) {
            //@todo this should be same as write file
            case "create":
                /**
                 * Here we create an empty file based on the path
                 * and filename passed, may have issues due to 
                 * the way directories and files are created (non-recursive)
                 */
                //args = [path, filename];
                //path = args[0].replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
                full_path = args[0] + '/' + args[1];
                this.write(full_path, 'empty_file', null, cb);
            break;
            case "move":
            case "mv":
            case "rename":
                var tmp = args[1].split('/');
                tmp.pop();
                var new_to = tmp.join('/') + "/" + args[0];
                this.rename(args[1], new_to, false, false, cb);
            break;
            case "login":
            case "authenticate":
                break;
            case "logout":
                break;
            case "exists":
                this.exists(args[0], cb);
                break;
            case "read":
                this.readFile(args[0], cb);
                break;
            case "create":
                full_path = args[0] ? args[0] : "";
                if (full_path.charAt(full_path.length - 1) != "/")
                    full_path = full_path + "/";
                this.writeFile(full_path + args[1], args[2], args[3] || false, cb);
                break;
            case "write":
            case "store":
            case "save":
                this.writeFile(args[0], args[1], args[2] || false, cb);
                break;
            case "copy":
            case "cp":
                this.copy(args[0], args[1], args[2] || true, args[3] || false, cb);
                break;
            case "rename":
                var sBasepath = args[1].substr(0, args[1].lastIndexOf("/") + 1);
                this.rename(args[1], sBasepath + args[0], args[2] || false, args[3] || false, cb);
                break;
            case "move":
            case "mv":
                full_path = args[1];
                if (full_path.charAt(full_path.length - 1) != "/")
                    full_path = full_path + "/";
                this.rename(args[0], full_path + args[0].substr(args[0].lastIndexOf("/") + 1),
                    args[2] || false, args[3] || false, cb);
                break;
            case "remove":
            case "rmdir":
            case "rm":
                this.remove(args[0], args[1] || false, cb);
                break;
            case "readdir":
            case "scandir":
                if (!ide.onLine)
                    this.readdir(args[0], cb);
                break;
            case "getroot":
                this.getProperties(this.$rootPath, 0, cb);
                break;
            case "mkdir":
                full_path = args[0] ? args[0] : "";
                if (full_path.charAt(full_path.length - 1) != "/")
                    full_path = full_path + "/";
                this.mkdir(full_path + args[1], args[2] || false, cb);
                break;
            case "lock":
                this.lock(args[0], null, null, null, cb);
                break;
            case "unlock":
                this.unlock(args[0], cb);
                break;
            case "report":
                break;
            default:
                //#ifdef __DEBUG
                throw new Error(apf.formatErrorString(0, null, "Saving/Loading data",
                    "Invalid WebDAV method '" + method + "'"));
                //#endif
                break;
        }
    };
    
    this.handleError = function(callback, error) {
        callback(null, apf.ERROR, error ? {message: error.code} : {});
    };
}).call(WebdavHtml5FileSystem.prototype = new apf.Class().$init());

});