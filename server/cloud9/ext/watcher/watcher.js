/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var fs      = require("fs"),
    sys     = require("sys"),
    Plugin  = require("cloud9/plugin");
   
var IGNORE_TIMEOUT = 50,
    ignoredPaths = {},
    ignoreTimers = {};
 
var cloud9WatcherPlugin = module.exports = function(ide, workspace) {
    Plugin.call(this, ide, workspace);

    ide.davServer.plugins['watcher'] = function (handler) {
        handler.addEventListener('beforeWriteContent', function (e, uri) {
            var path = handler.server.tree.basePath + '/' + uri;

            // console.log('Detected save', path);
            ignoredPaths[path] = 1;
            e.next();
        });
    };

    this.hooks = ["disconnect", "command"];
    this.name = "watcher";
    this.filenames = {};
}

sys.inherits(cloud9WatcherPlugin, Plugin);

(function() {
    this.unwatchFile = function(filename) {
        // console.log("No longer watching file " + filename);
        if (--this.filenames[filename] == 0) {
            delete this.filenames[filename];
            fs.unwatchFile(filename);
        }
        return true;
    };

    this.disconnect = function() {
        for (var filename in this.filenames) 
            this.unwatchFile(filename);
        return true;
    };

    this.command = function(user, message, client) {
        var filename, that, subtype, files;

        if (!message || message.command != "watcher") 
            return false;
        with (message) {
            if (command != "watcher")
                return false;

            switch (type) {
            case "watchFile":
                if (this.filenames[path]) 
                    ++this.filenames[path]; // console.log("Already watching file " + path);
                else {
                    // console.log("Watching file " + path);
                    that = this;
                    fs.watchFile(path, function (curr, prev) {
                        //console.log('Detected event', path, ignoredPaths);
                        if (ignoredPaths[path]) {
                            clearTimeout(ignoreTimers[path]);
                            ignoreTimers[path] = setTimeout(function() {
                                delete ignoreTimers[path]
                                delete ignoredPaths[path];
                            }, IGNORE_TIMEOUT);
                            return;
                        }
                        if (curr.nlink == 1 && prev.nlink == 0)
                            subtype = "create";
                        else if (curr.nlink == 0 && prev.nlink == 1)
                            subtype = "remove";
                        else if (curr.mtime.toString() != prev.mtime.toString()) 
                            subtype = "change";
                        else
                            return;
                        if (curr.isDirectory()) {
                            files = {};
                            
                            // TODO don't use sync calls
                            fs.readdirSync(path).forEach(function (file) {
                                var stat = fs.statSync(path + "/" + file);

                                if (file.charAt(0) != '.') {
                                    files[file] = {
                                        type : stat.isDirectory() ? "folder" : "file",
                                        name : file
                                    };
                                }
                            });
                        }
                        that.send({
                            "type"      : "watcher",
                            "subtype"   : subtype,
                            "path"      : path,
                            "files"     : files
                        });
                        //console.log("Sent " + subtype + " notification for file " + path);
                    });
                    this.filenames[path] = 0;
                }
                return true;
            case "unwatchFile":
                return this.unwatchFile(path);
            default:
                return false;
            }
        }
    };
    
    this.dispose = function(callback) {
        for (filename in this.filenames)
            this.unwatchFile(this.filenames[filename]);
        callback();
    };
    
}).call(cloud9WatcherPlugin.prototype);