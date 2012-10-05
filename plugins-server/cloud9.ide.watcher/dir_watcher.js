/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
"use strict";

var util = require("util");
var FileWatcher= require("file_watcher");

module.exports = FileWatcher;

function DirWatcher(vfs, path) {
    FileWatcher.call(this, vfs, path);
}

util.inherits(DirWatcher, FileWatcher);

(function() {

    this._onChange = function(event, path) {
        var self = this;

        if (!this.watcher)
            return;

        console.log(event, path);
        self.emit("change");
    };

}).call(DirWatcher.prototype);