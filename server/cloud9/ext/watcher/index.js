/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var fs      = require("fs"),
    plugin  = require("cloud9/plugin");

function cloud9WatcherPlugin(ide) {
    this.ide = ide;
    this.hooks  = ["disconnect", "command"];
}

(function() {
    var filenames = {};

    function unwatchFile(filename) {
        console.log("No longer watching file " + filename);
        delete filenames[filename];
        fs.unwatchFile(filename);
        return true;
    }

    this.disconnect = function() {
        for (var filename in filenames) 
            unwatchFile(filename);
        return true;
    };

    this.command = function(message) {
        var filename, that, subtype;

        if (!message || message.command != "watcher") 
            return false;
        with (message) {
            if (command != "watcher")
                return false;
            filename = path.replace(/\/workspace/, this.ide.workspaceDir);
            switch (type) {
            case "watchFile":
                if (filenames[filename]) 
                    console.log("Already watching file " + filename);
                else {
                    console.log("Watching file " + filename);
                    that = this;
                    fs.watchFile(filename, function (curr, prev) {
                        if (curr.nlink == 1 && prev.nlink == 0)
                            subtype = "create";
                        else if (curr.nlink == 0 && prev.nlink == 1)
                            subtype = "remove";
                        else if (curr.mtime.toString() != prev.mtime.toString()) 
                            subtype = "change";
                        else
                            return;
                        that.ide.broadcast(JSON.stringify({
                            "type"      : "watcher",
                            "subtype"   : subtype,
                            "path"      : path
                        }));
                        console.log("Sent " + subtype + " notification for file " + filename);
                    });
                    filenames[filename] = filename;
                }
                return true;
            case "unwatchFile":
                return unwatchFile(filename);
            default:
                return false;
            }
        }
    };
}).call(cloud9WatcherPlugin.prototype = new plugin());

module.exports = cloud9WatcherPlugin;
