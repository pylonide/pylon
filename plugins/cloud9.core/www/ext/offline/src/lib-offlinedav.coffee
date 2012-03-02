define (require, exports, module) ->
  
  class OfflineDav
    constructor: (@fs, @sync) ->
      @fake = true
      
    handleError: (error) ->
      console.log "OfflineDav Error: #{error.message}"
      
    exists: (path, callback) ->
        # This will be moved to offline fs, but for now we'll do this handler
        @fs.fs.getFile path, {create: false},
            (fileHandler) ->
                callback true
        ,
            (error) =>
                # Type error, lets check for dir
                if error.code is 11
                    @fs.fs.getDirectory path, {create: false},
                        (dirHandler) ->
                            callback true
                    ,
                        (error) ->
                            callback false
            
        
        
      
    read: (path, callback) ->
      @fs.readFile 'string', path, {}, (error, data) =>
        if error
          @handleError error
        else
          callback data, apf.SUCCESS, {}
        return
      return
      
    readFile: (path, callback) ->
        @read path, callback
        return
        
    readdir: (path, callback) ->
        @fs.listDir path, {}, (error, directories) =>
            # Need to return the XML for this directory
            
    mkdir: (path, lock, callback) ->
        options =
            create: true
            exclusive: lock
        @fs.createDir path, options, (error, dirHandler) =>
            @readdir dirHandler.fullPath, {}, callback
            
    list: (path, callback) ->
        # Not sure what method does
       
    write: (path, content, lock, binary, callback) ->
        @fs.write content, path, {}, (error, fileHandler) =>
            if error
                #callback
            else
                #callback
                
    copy: (sFrom, sTo, bOverwrite, bLock, callback) ->
        # copy op
        
    move: (sFrom, sTo, bOverwrite, bLock, callback) ->
        # move op
        
    rename: (sFrom, sTo, bOverwrite, bLock, callback) ->
        @move sFrom, sTo, bOverwrite, bLock, callback
        
    remove: (sPath, bLock, callback) ->
        # remove op
        
    report: (sPath, reportName, oProperties, callback) ->
        # report
        
    lock: (sPath, iDepth, iTimeout, sLock, callback) ->
        #lock
        
    unlock: (oLock, callback) ->
        # unlock
        
    exec: (method, args, callback) ->
        ### Need to link these up with handlers ###
        ###
        switch method
            when "login", "authenticate" callback
            when "logout" @reset();
            when "exists" @this.exists(args[0], cb)
            when "read" @readFile(args[0], cb);
            when "create":
                var path = args[0] ? args[0] : "";
                if (path.charAt(path.length - 1) != "/")
                    path = path + "/";
                this.writeFile(path + args[1], args[2], args[3] || false, cb);
                break;
            when "write":
            when "store":
            when "save":
                this.writeFile(args[0], args[1], args[2] || false, cb);
                break;
            when "copy":
            when "cp":
                this.copy(args[0], args[1], args[2] || true, args[3] || false, cb);
                break;
            when "rename":
                var sBasepath = args[1].substr(0, args[1].lastIndexOf("/") + 1);
                this.rename(args[1], sBasepath + args[0], args[2] || false, args[3] || false, cb);
                break;
            when "move":
            when "mv":
                path = args[1];
                if (path.charAt(path.length - 1) != "/")
                    path = path + "/";
                this.rename(args[0], path + args[0].substr(args[0].lastIndexOf("/") + 1),
                    args[2] || false, args[3] || false, cb);
                break;
            when "remove":
            when "rmdir":
            when "rm":
                this.remove(args[0], args[1] || false, cb);
                break;
            when "readdir":
            when "scandir":
                this.readdir(args[0], cb);
                break;
            when "getroot":
                this.getProperties(this.$rootPath, 0, cb);
                break;
            when "mkdir":
                path = args[0] ? args[0] : "";
                if (path.charAt(path.length - 1) != "/")
                    path = path + "/";
                this.mkdir(path + args[1], args[2] || false, cb)
                break;
            when "lock":
                this.lock(args[0], null, null, null, cb);
                break;
            when "unlock":
                this.unlock(args[0], cb);
                break;
            when "report":
                this.report(args[0], args[1], args[2], cb);
                break;
            default:
                //#ifdef __DEBUG
                throw new Error(apf.formatErrorString(0, null, "Saving/Loading data",
                    "Invalid WebDAV method '" + method + "'"));
                //#endif
                break;
            ###