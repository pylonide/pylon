/**
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var cloud9WatcherPlugin = require('cloud9/ext/watcher/watcher');
var assert = require('assert');

// assert that unwatch does the right thing
(function() {
    var ide = {
        workspaceDir: __dirname,
        davServer: {plugins: {}}
    };

    var workspace = {
        send: function() {}
    };

    var w = new cloud9WatcherPlugin(ide, workspace);
    assert.equal(Object.keys(w.filenames).length, 0);

    w.command(null, {command:'watcher', type:'watchFile', path:'..'}, null);
    assert.equal(Object.keys(w.filenames).length, 1);

    w.command(null, {command:'watcher', type:'unwatchFile', path:'..'}, null);
    assert.equal(Object.keys(w.filenames).length, 0);
})();
