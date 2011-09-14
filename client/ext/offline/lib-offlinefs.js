define(function(require, exports, module) {

/**
 * @package webfs
 * @copyright  Copyright(c) 2011 Ajax.org B.V. <info AT ajax.org>
 * @author Tane Piper <tane AT ajax DOT org>
 * @license http://github.com/ajaxorg/webfs/blob/master/LICENSE MIT License
 */

/**
 * We need to ensure that we have the correct version of requestFileSystem and
 * BlobBuilder available to the script
 */
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;


/**
 * @class WebFS object
 * @description Can take a pre-existing native local filesystem as a
 *              parameter.  If not parameter passed, filesystem can be set with
 *              setFileSystem 
 */
var WebFS = module.exports = (function() {
    
    /**
     * @constructor
     * @description Can take a pre-existing native local filesystem as a
     *              parameter.  If not parameter passed, filesystem can be set with
     *              setFileSystem
     * @param   {DOMFileSystem}     fs
     * @type    {void}
     */
    function WebFS(fs) {
        this.fs = fs;
        if (fs)
            this.root = fs.root;
    }
    
    // Filesystem system types flags
    WebFS.prototype.TEMPORARY                   = 0;
    WebFS.prototype.PERSISTENT                  = 1;
    // Filesystem progress flags
    WebFS.prototype.EMPTY                       = 0;
    WebFS.prototype.LOADING                     = 1;
    WebFS.prototype.DONE                        = 2;
    // Filesystem error flags
    WebFS.prototype.NOT_FOUND_ERR               = 1;
    WebFS.prototype.SECURITY_ERR                = 2;
    WebFS.prototype.ABORT_ERR                   = 3;
    WebFS.prototype.NOT_READABLE_ERR            = 4;
    WebFS.prototype.ENCODING_ERR                = 5;
    WebFS.prototype.NO_MODIFICATION_ALLOWED_ERR = 6;
    WebFS.prototype.INVALID_STATE_ERR           = 7;
    WebFS.prototype.SYNTAX_ERR                  = 8;
    WebFS.prototype.INVALID_MODIFICATION_ERR    = 9;
    WebFS.prototype.QUOTA_EXCEEDED_ERR          = 10;
    WebFS.prototype.TYPE_MISMATCH_ERR           = 11;
    WebFS.prototype.PATH_EXISTS_ERR             = 12;
    
    WebFS.prototype.DIR_SEPARATOR = '/';
    WebFS.prototype.DIR_BLACKLIST = ['.', './', '..', '../', '/'];
    WebFS.prototype.TYPE_FILE = 'file';
    WebFS.prototype.TYPE_DIR = 'dir';
    
    
    /**
     * Creates a stats object
     * @private
     * @param   {FileEntry, DirectoryEntry}   entry
     * @param   {Function}                    callback
     * @type    {void}
     */
    var Stats = function(entry, callback) {
        var _self = {};
        
        if (entry.isFile) {
            
            entry.file(function(file) {
                
                var t = file.lastModifiedDate;
                var m = t.getMonth() + 1;
                var month = m < 10 ? "0" + m : m;
            
                var time = [t.getFullYear(), month, t.getDate()].join('-') + 'T' + [t.getHours(), t.getMinutes(), t.getSeconds()].join(':') + 'Z';
            
                _self.mtime = time;
                _self.atime = time;
                _self.ctime = time;
                
                _self.size = file.fileSize;
                
                afterMetaData()
            });
        } else {
            entry.getMetadata(function(metadata) {
                var t = metadata.modificationTime;
                var m = t.getMonth() + 1;
                var month = m < 10 ? "0" + m : m;
                
                var time = [t.getFullYear(), month, t.getDate()].join('-') + 'T' + [t.getHours(), t.getMinutes(), t.getSeconds()].join(':') + 'Z';
                
                _self.mtime = time;
                _self.atime = time;
                _self.ctime = time;
                
                _self.size = 0;
                
                afterMetaData()
            });
        }
        
        function afterMetaData() {
            
            _self.dev = 0;
            _self.ino = 0;
            _self.mode = 0;
            _self.nlink = 0;
            _self.uid = 0;
            _self.gid = 0;
            _self.rdev = 0;
            _self.blocks = 0;
            
            
            _self.isDirectory = entry.isDirectory;
            _self.isFile = entry.isFile;
            
            /**
             * These next stats functions all return false for nodejs compatibility
             */
            _self.isBlockDevice = false;
            _self.isCharacterDevice = false;
            _self.isSymbolicLink = false;
            _self.isFIFO = false;
            _self.isSocket = false;
            
            callback(null, _self);
        }
    };

    /**
     * Returns if requestFileSystem is available
     * @type    {void}
     */
    WebFS.prototype.isAvailable = function(){
        return !!window.requestFileSystem;
    };
    
    /**
     * Error handler for file system operations
     * @param   {Error}     error
     * @type    {void}
     */
    WebFS.prototype.errorHandler = function(error) {
        var msg;
        
        switch(error.code) {
            case this.NOT_FOUND_ERR:
                error.message = "The file or directory has not been found";
                break;
            case this.SECURITY_ERR:
                error.message = "The file you are attempting to access is unsafe for web access or may be being accessed too many times.";
                break;
            case this.ABORT_ERR:
                error.message = "The current operation has been aborted";
                break;
            case this.NOT_READABLE_ERR:
                error.message = "The file you are attempting to read is not readable, this may be a permissions issue.";
                break;
            case this.ENCODING_ERR:
                error.message = "The data or URL passed is malformed";
                break;
            case this.NO_MODIFICATION_ALLOWED_ERR:
                error.message = "The file or directory cannot be modified.";
                break;
            case this.INVALID_STATE_ERR:
                error.message = "The file or directory state has changed since the last operation.";
                break;
            case this.SYNTAX_ERR:
                error.message = "There is a syntax error with this file operation.";
                break;
            case this.INVALID_MODIFICATION_ERR:
                error.message = "Invalid file operation.";
                break;
            case this.QUOTA_EXCEEDED_ERR:
                msg = "The quota for the filesystem has been exceeded.";
                break;
            case this.TYPE_MISMATCH_ERR:
                error.message = "Incorrect file operation on file or directory.";
                break;
            case this.PATH_EXISTS_ERR:
                error.message = "This path already exists";
                break;
        }
        
        return error;
    };
    
    /**
     * If the user does not use an external fs object, we can call this method
     * to create a new file system object
     * @param   {Number}    type
     * @param   {Number}    size
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.setFileSystem = function(type, size, callback) {
        var _self = this;
        
        var successHandler = function(fs) {
            _self.fs = fs;
            _self.root = fs.root;
            callback(null, _self);
        };
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        requestFileSystem(type, (size * 1024 *1024), successHandler, errorHandler);
    };
    
    /**
     * Get the current raw filesystem for this WebFS object
     * @type    {void}
     */
    WebFS.prototype.getFileSystem = function() {
        return this.fs;
    };
    
    /**
     * Rename or move src to dest.  If dest is a directory, must contain a trailing '/' char.
     * @param   {String}    src 
     * @param   {String}    dest
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.rename = function(src, dest, callback) {
        var _self = this;
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        var doMove = function(srcDirEntry, destDirEntry, newName) {
            var name = newName || null;
            srcDirEntry.moveTo(destDirEntry, name, function(newDirEntry) {
                callback(null, newDirEntry);
            }, errorHandler);
        };
        
        if (dest[dest.length - 1] == _self.DIR_SEPARATOR) {
            _self.root.getDirectory(src, {}, function(srcDirEntry) {
                // Create blacklist for dirs we can't re-create.
                var create = _self.DIR_BLACKLIST.indexOf(dest) != -1 ? false : true;
             
                _self.root.getDirectory(dest, {create: create}, function(destDirEntry) {
                    doMove(srcDirEntry, destDirEntry);
                }, errorHandler);
             }, function(error) {
                 // Try the src entry as a file instead.
                _self.root.getFile(src, {}, function(srcDirEntry) {
                    _self.root.getDirectory(dest, {}, function(destDirEntry) {
                        doMove(srcDirEntry, destDirEntry);
                    }, errorHandler);
                }, errorHandler);
            });
        } else {
            // Treat src/destination as files.
            _self.root.getFile(src, {}, function(srcFileEntry) {
                srcFileEntry.getParent(function(parentDirEntry) {
                    doMove(srcFileEntry, parentDirEntry, dest);
              }, errorHandler);
            }, errorHandler);
        }
    };
    
    /**
     * Takes a file handler and truncates the content to the passed length
     * @param   {FileEntry} fileEntry
     * @param   {Number}    len
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.truncate = function(fileEntry, len, callback) {
        var _self = this;
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
    
        fileEntry.createWriter(function(fileWriter) {
            fileWriter.onwriteend = function(e) {
                callback(null, fileEntry, e);
            };
            fileWriter.onerror = errorHandler;
                
            fileWriter.truncate(len);
        });
    };
    
    /**
     * Stub chmod function for nodejs compatiblity
     * @param   {String}    path
     * @param   {Number}    mode
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.chmod = function(path, mode, callback) {
        callback();
    };
    
    /**
     * Returns a stat object from a path
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.stat = function(path, callback) {
        var _self = this;
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        this.open(path, function(error, fileHandler) {
            if (error && error.code == _self.TYPE_MISMATCH_ERR) {
                // Get a directory instead
                _self.root.getDirectory(path, {}, function(dirHandler) {
                    Stats(dirHandler, callback);
                }, errorHandler);
            } else if (error) {
                errorHandler(error);
            } else {
                Stats(fileHandler, callback);
            }
        });
    };
    
    /**
     * Returns a stat object from a path
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     * @function
     */
    WebFS.prototype.lstat = WebFS.prototype.stat;
    
    /**
     * Returns a stat object from a file descriptor
     * @param   {FileEntry, DirectoryEntry} fd
     * @param   {Function}                  callback
     * @type    {void}
     */
    WebFS.prototype.fstat = function(fd, callback) {
        Stats(fd, callback);
    };
    
    /**
     * Stub link function for nodejs compatibility
     * @param   {String}    srcpath
     * @param   {String}    destpath
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.link = function(srcpath, destpath, callback) {
        callback();
    };
    
    /**
     * Stub symlink function for nodejs compatibility
     * @param   {String}    linkdata
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.symlink = function(linkdata, path, callback) {
        callback();
    };
    
    /**
     * Stub readlink function for nodejs compatibility
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.readlink = function(path, callback) {
        callback();
    };
    
    /**
     * Stub realpath function for nodejs compatibility
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.realpath = function(path, callback) {
        callback();
    };
    
    /**
     * Deletes a file from the path.  Directories are removed recursivly
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.unlink = function(path, callback) {
        var _self = this;
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        _self.root.getFile(path, {}, function(fileEntry) {
            fileEntry.remove(callback, errorHandler);
        }, function(error) {
            if (error.code == FileError.TYPE_MISMATCH_ERR) {
                _self.root.getDirectory(path, {}, function(dirEntry) {
                    dirEntry.removeRecursively(callback, errorHandler);
                }, errorHandler);
            } else {
                errorHandler(error);
            }
        });
    };
    
    /**
     * Deletes a directory from the path.  Directories are removed recursivly
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     * @function
     */
    WebFS.prototype.rmdir= WebFS.prototype.unlink;
    
    /**
     * Creates a directory on the filesystem, will recursivly create paths
     * @param   {String}    path
     * @param   {Number}    mode
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.mkdir = function(path, mode, callback) {
        var _self = this;
        
        if (typeof callback != "function") {
            callback = mode;
        }
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        var createDir = function(rootDir, folders) {
            if (folders[0] == '.' || folders[0] == '') {
                folders = folders.slice(1);
            }

            rootDir.getDirectory(folders[0], {create: true}, function(dirEntry) {
                if (folders.length) {
                    createDir(dirEntry, folders.slice(1));
                } else {
                    callback(null, dirEntry);
                }
            }, errorHandler);
        };
        createDir(this.fs.root, path.split('/'));
    };
    
    /**
     * Reads the contents of a directory, returns the result as an array of entries
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.readdir = function(path, callback) {
        var _self = this;
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        var listHandler = function(dirHandler) {
            var dirReader = dirHandler.createReader();
            var entries = [];
            var readEntries = function() {
                dirReader.readEntries(function(results) {
                    if (!results.length) {
                        callback(null, entries.sort());
                    } else {
                        for (var i = 0, j = results.length; i < j; i++) {
                            if (results[i].isDirectory)
                                entries.push(results[i].fullPath + '/');
                            else
                                entries.push(results[i].fullPath);
                        }
                        //entries = entries.concat(Array.prototype.slice.call(results || [], 0));
                        readEntries();
                    }
                }, errorHandler);
            };
            readEntries();
        };
        
        _self.root.getDirectory(path, {}, listHandler, errorHandler);
    };
    
    /**
     * 'Close' a file or directory handler by setting it to null
     * @param   {FileEntry, DirectoryEntry} fd
     * @param   {Function}                  callback
     * @type    {void}
     */
    WebFS.prototype.close = function(fd, callback) {
        fd = null;  // Set to null for GC
        callback();
    };
    
    /**
     * Opens a file or directory and return a handler
     * @param   {String}    path
     * @param   {String}    flags
     * @param   {Number}    mode
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.open = function(path, flags, mode, callback) { 
        var _self = this;
        
        if (typeof callback != "function") {
            callback = mode;
        }
        if (typeof callback != "function") {
            callback = flags;
        }
        
        var errorHandler = function(error) {
            if (error && error.code == _self.TYPE_MISMATCH_ERR) {
                _self.root.getDirectory(path, options, successHandler, function(error) {
                    callback(_self.errorHandler(error));
                });
            }
        };
        
        var successHandler = function(fileHandler) {
            callback(null, fileHandler);
        };
        
        var options = {};
        // If the flag is to write or append, and the file does not exist
        // then we need to ensure it's created
        if (['w', 'w+', 'a', 'a+'].indexOf(flags) > -1)
            options.create = true;

        _self.root.getFile(path, options, successHandler, errorHandler);
    };
    
    /**
     * Writes the contents of a Blob or File to a FileEntry on the filesystem
     * @param   {FileEntry} fileHandler
     * @param   {Mixed}     buffer
     * @param   {Number}    offset
     * @param   {Number}    length
     * @param   {Number}    position
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.write = function(fileHandler, buffer, offset, length, position, callback) {
        var _self = this,
            data;
            
        if (typeof callback != "function") {
            callback = position;
        }
        if (typeof callback != "function") {
            callback = length;
        }
        if (typeof callback != "function") {
            callback = offset;
        }
            
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
                
        var data = (typeof buffer == 'string') ? _self.createBlob(buffer) : buffer;
        
        var writerHandler = function(fileWriter) {
            
            fileWriter.onwriteend = function(e) {
                callback(null, e.loaded, buffer);
            };
            
            fileWriter.onerror = errorHandler;
          
            fileWriter.write(data);
        };
            
        fileHandler.createWriter(writerHandler, errorHandler);
    };
    
    /**
     * Asynchronously writes data to a file, replacing the file if it already exists.  Data can be a string or a buffer.
     * @param   {String}    filename
     * @param   {Mixed}     data
     * @param   {String}    encoding
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.writeFile = function(filename, data, encoding, callback) {
        var _self = this;
        
        if (typeof callback != 'function') {
            callback = encoding;
        }
        
        var buffer = (typeof data == 'string') ? _self.createBlob(data) : data;
        
        var openFileHandler = function(error, fileHandler) {
            _self.truncate(fileHandler, 0, function(error) {
                if (error)
                    return callback(error);
                _self.write(fileHandler, buffer, null, null, null, function(error, written, buffer_) {
                    callback(error, buffer_);  
                });
            });
        };
        
        _self.open(filename, 'w', null, openFileHandler);  
    };
    
    /**
     * Read data from the file specified by file handler.
     * @param   {FileEntry} fileHandler
     * @param   {Mixed}     buffer
     * @param   {Number}    offset
     * @param   {Number}    length
     * @param   {Number}    position
     * @type    {void}
     */
    WebFS.prototype.read = function(fileHandler, buffer, offset, length, position, callback) {
        var _self = this,
            data;
            
        if (typeof callback != "function") {
            callback = position;
        }
        if (typeof callback != "function") {
            callback = length;
        }
        if (typeof callback != "function") {
            callback = offset;
        }
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        fileHandler.file(function(file) {
            var reader = new FileReader();
            
            reader.onloadend = function(e) {
                buffer.append(this.result);
                callback(null, buffer.getBlob().size, buffer.getBlob());
            };
            
            reader.onerror = errorHandler;
            
            // Since we want to support binary or string data, we should read
            // as an array buffer and allow the user to determine the output
            // from the Blob/File interface buffer
            reader.readAsArrayBuffer(file);
        });
    };
    
    /**
     * Asynchronously reads the entire contents of a file and returns a buffer
     * @param   {String}    filename
     * @param   {String}    encoding
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.readFile = function(filename, encoding, callback) {
        var _self = this;
        
        if (typeof callback != 'function') {
            callback = encoding;
        }
                
        var successHandler = function(error, fileHandler) {
            if (error)
                return callback(error);
                
            _self.read(fileHandler, new BlobBuilder(), null, null, null, callback);
        };
        
        this.open(filename, null, null, successHandler);
    };
    
    /**
     * Takes data, string or binary, and creates a binary blob.
     * @param   {Mixed}     data
     * @param   {String}    encoding
     * @type    {void}
     */
    WebFS.prototype.createBlob = function(data, encoding) {
        var bb = new BlobBuilder();
        bb.append(data);
        if (encoding)
            return bb.getBlob(encoding);
        else
            return bb.getBlob();
    };
    
    /**
     * Method to get content of a blob or file as a string
     * @param   {File, Blob}    data
     * @param   {String}        encoding
     * @param   {Function}      callback
     * @type    {void}
     */
    WebFS.prototype.readString = function(data, encoding, callback) {
        
        var reader = new FileReader(),
            encoding_;
            
        if (typeof callback != 'function') {
            callback = encoding;
            encoding_ = 'UTF-8';
        } else {
            encoding_ = encoding;
        }
        
        reader.onloadend = function(event) {
            callback(null, this.result);
        };
        
        reader.onerror = function(error) {
            callback(error);
        };
        
        data = reader.readAsText(data, encoding_);
    };
    
    /**
     * Method to get content as a binary string
     * @param   {File, Blob}    data
     * @param   {Function}      callback
     * @type    {void}
     */
    WebFS.prototype.readBinaryString = function(data, callback) {
        var reader = new FileReader();
        reader.onloadend = function(event) {
            callback(null, this.result);
        };
        reader.onerror = function(error) {
            callback(error);
        };
        
        reader.readAsBinaryString(data);
    };
    
    /**
     * Method to get content as a array buffer
     * @param   {File, Blob}    data
     * @param   {Function}      callback
     * @type    {void}
     */
    WebFS.prototype.readArrayBuffer = function(data, callback) {
        var reader;
        reader = new FileReader();
        reader.onloadend = function(event) {
            callback(null, this.result);
        };
        reader.onerror = function(error) {
            callback(error);
        };
        
        reader.readAsArrayBuffer(data);
    };
    
    /**
     * Method to get content as a data url
     * @param   {File, Blob}    data
     * @param   {Function}      callback
     * @type    {void}
     */
    WebFS.prototype.readDataUrl = function(data, callback) {
        var reader = new FileReader();
        reader.onloadend = function(event) {
            callback(null, this.result);
        };
        reader.onerror = function(error) {
            callback(error);
        };
        
        reader.readAsDataURL(data);
    };
    
    return WebFS;
})();

});
