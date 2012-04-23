/**
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var cloud9WatcherPlugin = require('cloud9/ext/watcher/watcher');
var assert = require('assert');

// assert that adding lots of watchers for a single path doesn't trigger
// EventEmitter leak warnings
(function() {
    var ide = {
        workspaceDir: __dirname,
        davServer: {plugins: {}}
    };

    var workspace = {
        send: function() {}
    };

    var w = new cloud9WatcherPlugin(ide, workspace);

    // node's lib/event.js emits an error on stderr if the
    // EventEmitter._maxListeners is hit
    console.error = assert.fail;

    for (var i = 0; i < 42; ++i)
        w.command(null, {command:'watcher', type:'watchFile', path:'.'}, null);
    assert.equal(Object.keys(w.filenames).length, 1);

    var gotDisposeCallback = false;

    w.dispose(function() {
        assert.equal(Object.keys(w.filenames).length, 0);
        gotDisposeCallback = true;
    });

    process.on('exit', function() {
        assert.equal(gotDisposeCallback, true);
    });
})();
