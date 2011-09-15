/**
 * Offline Support for Cloud9
 *
 * @copyright 2011, Ajax.org B.V.
 */

define(function(require, exports, module) {

var util = require("core/util");
var fs = require("ext/filesystem/filesystem");
var ide = require("core/ide");

var WebdavLocalStorage = module.exports = function(callback, sync, fIdent) {
    this.fs     = null;
    this.sync   = sync;
    this.fIdent = fIdent;
    
    callback();
};

(function() {
    this.available = false;
    this.fake      = true;
    
    this.exists = function(path, callback) {
        if (localStorage[this.fIdent]) {
            var files = JSON.parse(localStorage[this.fIdent]);
            if (files[path])
                return callback(true);
            return callback(false);
        }
    };
    
    this.read = function(path, callback){
        if (localStorage[this.fIdent]) {
            var files = JSON.parse(localStorage[this.fIdent]);
            if (files[path])
                return callback(files[path], apf.SUCCESS, {});
        }
        this.handleError(callback);
    };
    
    this.write = function(path, data, x, callback){
        this.sync.add(path, {
            type: "webdav-write",
            date: fs.model.queryValue("//file[@path='" + path + "']/@modifieddate"),
            path: path,
            data: data
        });
        
        if (callback)
            callback("", apf.SUCCESS, {});
    };
    
    this.remove = function(path, lock, callback){
        return this.handleError(callback);
        
        /*
        this.sync.add(path, {
            type: "webdav-rm",
            path: path,
            lock: lock
        });
        
        if (callback)
            callback("", apf.SUCCESS, {});
        */
    };
    
    this.copy = function(from, to, overwrite, lock, callback){
        return this.handleError(callback);
        
        /*
        this.sync.add(from, {
            type: "webdav-copy",
            from: from,
            to: to,
            overwrite: overwrite,
            lock: lock
        });
        
        if (callback)
            callback("", apf.SUCCESS, {});
        */
    };
    
    this.move = function(from, to, overwrite, lock, callback){
        return this.handleError(callback);
        
        /*
        this.sync.add(from, {
            type: "webdav-move",
            from: from,
            to: to,
            overwrite: overwrite,
            lock: lock
        });
        
        if (callback)
            callback("", apf.SUCCESS, {});
        */
    };
    
    this.list = function(path, callback){
        this.handleError(callback);
    };
    
    this.exec = function(type, args, callback) {
        switch(type) {
            case "create":
                //args = [path, filename];
            break;
            case "mkdir":
                //args = [path, name]
            break;
            case "login":
            case "authenticate":
            case "logout":
            case "read":
            case "readdir":
            case "scandir":
            case "getroot":
            case "lock":
            case "unlock":
                break;
            case "exists":
            case "create":
            case "write":
            case "store":
            case "save":
            case "copy":
            case "cp":
            case "rename":
            case "move":
            case "mv":
            case "remove":
            case "rmdir":
            case "rm":
            case "mkdir":
            case "report":
                //No can do
                this.handleError(callback);
        }
    };
    
    this.handleError = function(callback){
        if (!ide.onLine) {
            util.alert("Sorry, you are offline right now and cannot perform this operation");
            callback(null, apf.ERROR, {});
        }
    };
}).call(WebdavLocalStorage.prototype = new apf.Class().$init());

});
