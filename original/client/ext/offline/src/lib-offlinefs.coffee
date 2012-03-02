###
* Offline file system API
* @copyright 2010, Ajax.org B.V.
###
define (require, exports, module) ->
  # Detect if we have W3C or Webkit style filesystem
  window.requestFileSystem = window.requestFileSystem or window.webkitRequestFileSystem
  window.BlobBuilder = window.BlobBuilder or window.WebKitBlobBuilder
    
  class FileSystem
    ###
    Singleton Constants
    ###
    
    ### File system type flag ###
    TEMPORARY: 0
    PERSISTENT: 1
    
    ### File progress flags ###
    EMPTY: 0
    LOADING: 1
    DONE: 2
    
    ### File error flags ###
    NOT_FOUND_ERR: 1
    SECURITY_ERR: 2
    ABORT_ERR: 3
    NOT_READABLE_ERR: 4
    ENCODING_ERR: 5
        
    ###
    Constructor for file system
    ###
    constructor: ->
      @fs = null
      @forceLocalStorage = false
            
    ###
    This is the main method that needs to be called to initialise a filesystem
    for any requests
    ###
    getFileSystem: (type, size, callback) ->
      # TODO: This needs to do fallback to local storage if available
      if not window.requestFileSystem or @forceLocalStorage is true
        if not window.localStorage
          apf.console.error 'Unable to request local file system'
          callback 'Unable to request local file system'
        else
          @fs = localStorage['cloud9']
      else
        window.requestFileSystem type, size,
          (fileSystem) =>
            @fs = fileSystem
            if callback
              callback null, fileSystem; return
        , 
          (error) ->
            if callback
              callback error; return
      return
              
    ### Common File Methods ###
    ###
    * Method to save file
    * @param {Mixed} data The File or content to be saved
    * @param {String} path The path of the file to save
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method
    ###
    saveFile: (data, path, options, callback) ->  
      @fs.root.getFile path, {create: true},
        (fileEntry) =>
          fileEntry.createWriter (fileWriter) =>
            if options.append
              fileWriter.seek fileWriter.length
            fileWriter.onwriteend = (event) -> callback null, fileEntry, event; return
            fileWriter.onerror = (error) => callback error; return
            #fileWriter.onprogress = options.progress
            data = if typeof data is File then data else @getBlob data
            fileWriter.write data; return
          return
      ,
        (error) -> callback error; return
      return
    ###
    * Method to read file
    * @param {String} path The path of the file to read
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method
    ###
    openFile: (path, options, callback) ->
      @fs.root.getFile path, {create: false},
        (fileEntry) -> 
          fileEntry.file (file) ->
            callback null, file; return
          ,
            (error) -> callback error; return
          return
      , 
        (error) -> callback error; return
      return
          
    ###
    * Method to get a file in a specific format
    * @param {String} type The type to read as.  Can be `string`, `binaryString`, `arrayBuffer` and `dataUrl`
    * @param {String} path The path of the file to save
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method
    ###
    readFile: (type, path, options, callback) ->
      # WE HAVE STACK OVERFLOW!
      console.log('readFile Called', arguments);
      @readFile path, options, (error, file) =>
        console.log('error', error);
        if error
          callback error
        else
          console.log('doing try');
          try
            @['get' + type.charAt(0).toUpperCase() + type.slice(1)] file, {}, (error, string) ->
              if error
                callback error
              else
                callback null, string
              return
          catch exp
            callback exp
        return
      return 
            
    ###
    * Method to delete file
    * @param {String} path The path of the file to delete
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method
    ###
    deleteFile: (path, options, callback) ->
      @fs.root.getFile path, {create: false},
        (fileEntry) ->
          fileEntry.remove ->
            callback null; return
          ,
            (error) -> callback error; return
          return
      ,
        (error) -> callback error; return
      return
        
    ###
    * Method to rename file
    * Rename a file
    * @param {String} path The path to the existing file
    * @param {String} dest The destination name of the file
    * @param {Object} options A future options object
    * @param {Function} callback The callback function
    ###
    renameFile: (path, dest, options, callback) ->
      @fs.root.getFile path, {create: false},
        (fileEntry) =>
          fileEntry.moveTo @fs.root, dest,
            (newEntry) -> callback null, newEntry; return
          ,
            (error) -> callback error; return
          return
      ,
        (error) -> callback error; return
      return
        
    ###
    * Method to copy file
    * @param {String} path The path to the existing file
    * @param {String} dest The destination name of the file
    * @param {Object} options A future options object
    * @param {Function} callback The callback function
    * TODO: This currently crashes chrome after it creates the destination
    *       directory and tries to do the copy, no error
    ###
    copyFile: (path, dest, options, callback) ->
      @fs.root.getFile path, {create: false},
        (fileEntry) =>
          @fs.root.getDirectory dest, {create: true},
            (destEntry) ->
              fileEntry.copyTo destEntry,
                (newEntry) ->
                  callback null, newEntry; return
              ,
                (error) -> callback error; return
              return
          ,
            (error) -> callback error; return
          return
      ,
        (error) -> callback error; return
      return
        
        
    ###
    * Method to move file
    * @param {String} path The path to the existing file
    * @param {String} dest The destination name of the file
    * @param {Object} options A future options object
    * @param {Function} callback The callback function
    * TODO: This currently crashes chrome after it creates the destination
    *       directory and tries to do the copy, no error
    ###
    moveFile: (path, dest, options, callback) ->
      @fs.root.getFile path, {create: false},
        (fileEntry) =>
          @fs.root.getDirectory dest, {create: true},
            (destEntry) ->
              fileEntry.moveTo destEntry,
                (newEntry) ->
                  callback null, newEntry; return
              ,
                (error) -> callback error; return
              return
          ,
            (error) -> callback error; return
          return
      ,
        (error) -> callback error; return
      return
                    
    ### Common directory methods ###
    
    ###
    * Directory creation method
    * @param {String} path The path of the directory to create
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method with folder reference
    ###
    createDir: (path, options, callback) ->
      if not options?.create
        options.create = true
        
      @fs.root.getDirectory path, options,
        (dirEntry) -> callback null, dirEntry; return
      ,
        (error) -> callback error; return
      return
          
    ###  
    * Directory creation method, calls createDir with itteration
    * @param {Array} paths An array of paths
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method with folder reference
    ###
    createDirs: (paths, options, callback) ->
      dirs = []
      for path in paths
        @createDir path, {}, (error, result) ->
          if error
            callback error
          else
            dirs.push result
            if dirs.length is paths.length
              callback null, dirs
          return
      return
            
    ###
    * Directory listing method
    * @param {String} path The path of the directory to list
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method with folder list reference
    ###
    listDir: (path, options, callback) ->
      @fs.root.getDirectory path, {create: false},
        (dirEntry) ->
          dirReader = dirEntry.createReader()
          entries = []
          readEntries = ->
            dirReader.readEntries (results) ->
              if not results.length
                callback null, entries.sort()
              else
                entries = entries.concat Array.prototype.slice.call(results or [], 0)
              readEntries()
              return
            ,
              (error) -> callback error; return
            return
          readEntries()
          return
      ,
        (error) -> callback error; return
      return
          
    ###
    * Directory delete method
    * @param {String} path The path of the directory to delete
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method 
    ###
    deleteDir: (path, options, callback) ->
      @fs.root.getDirectory path, {create: false},
        (dirEntry) ->
          dirEntry.remove ->
            callback null; return
          ,
            (error) -> callback error; return
          return
      ,
        (error) -> callback error; return
      return
          
    ###
    * Directory delete method that calls deleteDir
    * @param {Array} path The array of the directories to delete
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method
    ###
    deleteDirs: (paths, options, callback) ->
      count = 0
      for path in paths
        @deleteDir path, {}, (error, result) ->
          if error
            callback error
          else
            count++
            if count is paths.length
              callback null
          return
      return
  
    ###
    * Method to copy directory
    * @param {String} path The path of the directory to copy
    * @param {String} outpath The path of the directory to copy to
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method
    * TODO: This completly crashes chrome
    ###
    copyDir: (path, dest, options, callback) ->
      @fs.root.getDirectory path, {create: false},
        (dirEntry) =>
          dirEntry.copyTo @fs.root, outpath,
            (newEntry) -> callback null, newEntry; return
          ,
            (error) -> callback error; return
          return
      ,
        (error) -> callback error; return
      return
        
    ###
    * Method to move or rename dir
    * @param {String} path The path of the dir to rename
    * @param {String} outpath The path of the dir to rename to
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method
    * TODO: This completly crashes chrome
    ###                     
    moveDir: (path, outpath, options, callback) ->
      @fs.root.getDirectory path, {create: false},
        (dirEntry) =>
          dirEntry.moveTo @fs.root, outpath,
            (newEntry) -> callback null, newEntry; return
          ,
            (error) -> callback error; return
          return
      ,
        (error) -> callback error; return
      return


    ###
    Method to create a blob from passed arguments
    ###
    getBlob: (var_args...) ->
      bb = new BlobBuilder()
      for item in var_args
        bb.append item
      return bb.getBlob()
      
    ###
    * Method to get content as a string
    * @param {Mixed} data The File or content to read
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method
    ###
    getString: (data, options, callback) ->
      if not options.encoding
        options.encoding = 'UTF-8'
      reader = new FileReader()
      reader.onloadend = (event) -> callback null, @result; return
      reader.onerror = (error) -> callback error; return
      #reader.onprogress = options.progress
      data = reader.readAsText data, options.encoding
      return
    
    ###
    * Method to get content as a binaryString
    * @param {Mixed} data The File or content to read
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method
    ###
    getBinaryString: (data, options, callback) ->
      reader = new FileReader()
      reader.onloadend = (event) -> callback null, @result; return
      reader.onerror = (error) -> callback error; return
      #reader.onprogress = options.progress
      reader.readAsBinaryString data
      return
    
    ###
    * Method to get content as a arrayBuffer
    * @param {Mixed} data The File or content to read
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method
    ###
    getArrayBuffer: (data, options, callback) ->
      reader = new FileReader()
      reader.onloadend = (event) -> callback null, @result; return
      reader.onerror = (error) -> callback error; return
      #reader.onprogress = options.progress
      reader.readAsArrayBuffer data
      return
    
    ###
    * Method to get content as a dataUrl
    * @param {Mixed} data The File or content to read
    * @param {Object} options and object of options, not used yet
    * @param {Function} callback Callback method
    ###
    getDataUrl: (data, options, callback) ->
      reader = new FileReader()
      reader.onloadend = (event) -> callback null, @result; return
      reader.onerror = (error) -> callback error; return
      #reader.onprogress = options.progress
      reader.readAsDataURL data
      return
      
    ###
    * Takes the path as the string and split it up, then remove the empty
    * array member at the front, and also workspace
    * then we pop the filename off the end, then create the
    * dirs in order they are needed.
    ###
    pathArrayFromString: (pathstring) ->
        ret = 
            path: pathstring
            filename: undefined
            full_path: undefined
            dirs: []
            
        # The next few lines here should probably
        # be a helper method on the offlinefs library
        tmpdirs = pathstring.split '/'
        # Hacky, to remove empty item and workspace
        tmpdirs.shift(); tmpdirs.shift()
        
        ret.filename = tmpdirs.pop()
        
        path = ''
        # Loop over each single dir, create an array
        # of correct paths.  e.g:
        #['foo', 'foo/bar', 'foo/bar/baz']
        # These need to be in correct path order, i.e. last item
        # will not create foo or bar dirs
        while (tmpdirs.length)
            path += "/#{tmpdirs.shift()}"
            ret.dirs.push path
            
        ret.full_path = "#{ret.dirs[ret.dirs.length - 1]}/#{ret.filename}"
        return ret
      
  return FileSystem